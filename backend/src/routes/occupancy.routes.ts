import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { asyncHandler } from '../lib/asyncHandler';
import { authenticate, authorize } from '../middleware/auth';
import { ROLES, OCCUPANCY_SLOTS, ROOM_SALE_SOURCES } from '../constants/roles';
import { parseDate, startOfDay, endOfDay, localDateKey, nowIST, istDateKey, isSlotWindowOpen, isSlotLocked, SlotTime } from '../lib/dates';
import { badRequest, notFound, forbidden } from '../lib/errors';
import { getTotalRooms, listRooms } from '../lib/rooms';

const router = Router();
router.use(authenticate);

// Only FRONT_OFFICE and MANAGEMENT roles can submit occupancy reports
const canSubmit = authorize(ROLES.ADMIN, ROLES.FRONT_OFFICE, ROLES.MANAGEMENT);

// Map internal slot enum to SlotTime type for time window validation
const SLOT_TO_TIME: Record<string, SlotTime> = {
  'SLOT_1000': '10am',
  'SLOT_1600': '4pm',
  'SLOT_2200': '10pm',
};

function computeOccupancy(roomsSold: number, workingRooms: number) {
  return workingRooms > 0 ? +((roomsSold / workingRooms) * 100).toFixed(2) : 0;
}

// ─── Config (form dropdowns) ──────────────────────────────
router.get(
  '/config',
  asyncHandler(async (_req, res) => {
    const [totalRooms, rooms, roomTypes, onlineSources, pujaris] = await Promise.all([
      getTotalRooms(),
      listRooms(true),
      prisma.roomType.findMany({ where: { active: true }, orderBy: { name: 'asc' } }),
      prisma.onlineSource.findMany({ where: { active: true }, orderBy: { name: 'asc' } }),
      prisma.pujari.findMany({ where: { active: true }, orderBy: { name: 'asc' } }),
    ]);
    res.json({ totalRooms, rooms, roomTypes, onlineSources, pujaris });
  })
);

// ─── Slots for a date ─────────────────────────────────────
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const date = startOfDay(parseDate((req.query.date as string) || undefined));
    const slots = await prisma.occupancySlot.findMany({
      where: { reportDate: date },
      include: { sales: { orderBy: { createdAt: 'asc' } } },
    });
    const totalRooms = await getTotalRooms();

    const bySlot = OCCUPANCY_SLOTS.map((key) => {
      const slot = slots.find((s) => s.slot === key);
      return {
        slot: key,
        submitted: !!slot,
        data: slot
          ? { ...slot, occupancy: computeOccupancy(slot.roomsSold, slot.workingRooms) }
          : null,
      };
    });

    res.json({ date, totalRooms, slots: bySlot });
  })
);

// ─── Single slot ──────────────────────────────────────────
router.get(
  '/slot/:id',
  asyncHandler(async (req, res) => {
    const slot = await prisma.occupancySlot.findUnique({
      where: { id: req.params.id },
      include: { sales: { orderBy: { createdAt: 'asc' } } },
    });
    if (!slot) throw notFound('Occupancy slot not found');
    res.json({ ...slot, occupancy: computeOccupancy(slot.roomsSold, slot.workingRooms) });
  })
);

// ─── Create / update a slot (upsert by date + slot) ───────
const saleSchema = z.object({
  roomId: z.string().optional().nullable(), // set when picked from the room list
  roomType: z.string().optional().nullable(),
  roomNumber: z.string().optional().nullable(),
  source: z.enum(ROOM_SALE_SOURCES),
  sourceDetail: z.string().optional().nullable(),
  priceSold: z.number().min(0),
});

const upsertSchema = z.object({
  date: z.string(),
  slot: z.enum(OCCUPANCY_SLOTS),
  workingRooms: z.number().int().min(0),
  notes: z.string().max(1000).optional().nullable(),
  sales: z.array(saleSchema),
});

router.post(
  '/',
  canSubmit,
  asyncHandler(async (req, res) => {
    const data = upsertSchema.parse(req.body);
    const reportDate = startOfDay(parseDate(data.date));
    const totalRooms = await getTotalRooms();

    // ── Time window validation ────────────────────────────────
    const todayIST = istDateKey(nowIST());
    const requestedDate = data.date; // YYYY-MM-DD string

    // Block backdate and forward date submissions
    if (requestedDate !== todayIST) {
      throw forbidden(
        `Cannot submit reports for ${requestedDate}. Only today's date (${todayIST}) is allowed.`
      );
    }

    // Check if the slot's time window is currently open
    const slotTime = SLOT_TO_TIME[data.slot];
    if (!slotTime) {
      throw badRequest(`Invalid slot: ${data.slot}`);
    }

    if (!isSlotWindowOpen(slotTime)) {
      throw forbidden(
        `The ${slotTime} slot window is not open right now. Submit during the designated time window only.`
      );
    }

    // ── Existing validation ───────────────────────────────────
    if (totalRooms <= 0) {
      throw badRequest('Total rooms is not configured. Ask an Admin to set it in Settings.');
    }
    if (data.workingRooms > totalRooms) {
      throw badRequest(`Working rooms (${data.workingRooms}) cannot exceed total rooms (${totalRooms}).`);
    }
    if (data.sales.length > data.workingRooms) {
      throw badRequest(
        `Rooms sold (${data.sales.length}) cannot exceed working rooms (${data.workingRooms}).`
      );
    }

    // Resolve room list picks: snapshot number + type from the Room record so
    // sales stay correct even if the room is later renamed or deleted.
    const roomIds = data.sales.map((s) => s.roomId).filter((id): id is string => !!id);
    const rooms = roomIds.length
      ? await prisma.room.findMany({ where: { id: { in: roomIds } }, include: { roomType: true } })
      : [];
    const roomById = new Map(rooms.map((r) => [r.id, r]));

    const resolvedSales = data.sales.map((s) => {
      const room = s.roomId ? roomById.get(s.roomId) : undefined;
      if (s.roomId && !room) throw badRequest('A selected room no longer exists. Refresh and try again.');
      const roomNumber = (room?.number ?? s.roomNumber ?? '').trim();
      const roomType = (room?.roomType?.name ?? s.roomType ?? '').trim();
      if (!roomNumber) throw badRequest('A room row is missing its room number.');
      if (!roomType) throw badRequest(`Room ${roomNumber}: missing room type.`);
      return { ...s, roomId: room?.id ?? null, roomNumber, roomType };
    });

    // No duplicate room numbers within a slot.
    const roomNumbers = resolvedSales.map((s) => s.roomNumber.toLowerCase());
    const dupes = roomNumbers.filter((n, i) => roomNumbers.indexOf(n) !== i);
    if (dupes.length > 0) {
      throw badRequest(`Duplicate room number(s) in this slot: ${[...new Set(dupes)].join(', ')}`);
    }

    // Per-source detail validation.
    for (const s of resolvedSales) {
      if (s.source === 'ONLINE' && !s.sourceDetail) {
        throw badRequest(`Room ${s.roomNumber}: select the online source (OTA).`);
      }
      if (s.source === 'PUJARI' && !s.sourceDetail) {
        throw badRequest(`Room ${s.roomNumber}: select the Pujari.`);
      }
    }

    // Stamp Pujari commissions at submit time so later edits to a Pujari's
    // % or name can never rewrite historical payouts.
    const pujariNames = [...new Set(
      resolvedSales.filter((s) => s.source === 'PUJARI').map((s) => s.sourceDetail as string)
    )];
    const pujaris = pujariNames.length
      ? await prisma.pujari.findMany({ where: { name: { in: pujariNames } } })
      : [];
    const pujariByName = new Map(pujaris.map((p) => [p.name, p]));
    for (const name of pujariNames) {
      if (!pujariByName.has(name)) {
        throw badRequest(`Pujari "${name}" not found. Refresh and try again.`);
      }
    }

    const roomsSold = resolvedSales.length;
    const totalRevenue = resolvedSales.reduce((sum, s) => sum + s.priceSold, 0);
    const outOfOrder = totalRooms - data.workingRooms;

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.occupancySlot.findUnique({
        where: { reportDate_slot: { reportDate, slot: data.slot } },
      });

      const base = {
        totalRooms,
        workingRooms: data.workingRooms,
        outOfOrder,
        roomsSold,
        totalRevenue,
        submittedById: req.user!.sub,
        submittedByName: req.user!.name,
        notes: data.notes ?? null,
        submittedAt: new Date(),
      };

      let slot;
      if (existing) {
        await tx.roomSale.deleteMany({ where: { slotId: existing.id } });
        slot = await tx.occupancySlot.update({ where: { id: existing.id }, data: base });
      } else {
        slot = await tx.occupancySlot.create({
          data: { reportDate, slot: data.slot, ...base },
        });
      }

      if (resolvedSales.length > 0) {
        await tx.roomSale.createMany({
          data: resolvedSales.map((s) => {
            const pujari = s.source === 'PUJARI' ? pujariByName.get(s.sourceDetail as string) : undefined;
            const pct = pujari ? pujari.commissionPct : null;
            return {
              slotId: slot.id,
              roomId: s.roomId,
              roomType: s.roomType,
              roomNumber: s.roomNumber,
              source: s.source,
              sourceDetail: s.source === 'WALK_IN' ? null : s.sourceDetail ?? null,
              priceSold: s.priceSold,
              pujariId: pujari?.id ?? null,
              commissionPct: pct,
              commissionAmount: pct !== null ? +((s.priceSold * pct) / 100).toFixed(2) : null,
            };
          }),
        });
      }

      return slot;
    });

    // The 10 PM slot is the end-of-day source of truth → feed Revenue Analytics.
    if (data.slot === 'SLOT_2200') {
      const adr = roomsSold > 0 ? totalRevenue / roomsSold : 0;
      const revpar = data.workingRooms > 0 ? totalRevenue / data.workingRooms : 0;
      await prisma.revenueRecord.upsert({
        where: { recordDate: reportDate },
        create: {
          recordDate: reportDate,
          revenue: totalRevenue,
          roomsSold,
          roomsAvailable: data.workingRooms,
          adr: +adr.toFixed(2),
          revpar: +revpar.toFixed(2),
          source: 'MANUAL',
        },
        update: {
          revenue: totalRevenue,
          roomsSold,
          roomsAvailable: data.workingRooms,
          adr: +adr.toFixed(2),
          revpar: +revpar.toFixed(2),
          source: 'MANUAL',
        },
      });
    }

    const full = await prisma.occupancySlot.findUnique({
      where: { id: result.id },
      include: { sales: { orderBy: { createdAt: 'asc' } } },
    });
    res.status(201).json({ ...full, occupancy: computeOccupancy(roomsSold, data.workingRooms) });
  })
);

// ─── Delete a slot ────────────────────────────────────────
router.delete(
  '/slot/:id',
  canSubmit,
  asyncHandler(async (req, res) => {
    const existing = await prisma.occupancySlot.findUnique({ where: { id: req.params.id } });
    if (!existing) throw notFound('Occupancy slot not found');

    // Strict locking: once the time window passes, the slot is locked
    // Only admins can delete locked slots (by re-submitting after deletion)
    const slotTime = SLOT_TO_TIME[existing.slot];
    const dateKey = localDateKey(existing.reportDate);

    if (slotTime && isSlotLocked(slotTime, dateKey)) {
      if (req.user?.role !== ROLES.ADMIN) {
        throw forbidden(
          `This slot is locked (time window has passed). Only admins can delete locked slots.`
        );
      }
    }

    await prisma.occupancySlot.delete({ where: { id: req.params.id } });

    // The 10 PM slot feeds RevenueRecord — roll it back when deleted
    // (only if the record is MANUAL-sourced; never touch PMS data).
    if (existing.slot === 'SLOT_2200') {
      await prisma.revenueRecord.deleteMany({
        where: { recordDate: existing.reportDate, source: 'MANUAL' },
      });
    }
    res.json({ success: true });
  })
);

// ─── Month history (day-by-day summary) ───────────────────
router.get(
  '/history',
  asyncHandler(async (req, res) => {
    // month=YYYY-MM (defaults to the current month)
    const monthStr = (req.query.month as string) || undefined;
    const base = monthStr ? parseDate(`${monthStr}-01`) : new Date();
    const monthStart = startOfDay(new Date(base.getFullYear(), base.getMonth(), 1));
    const monthEnd = endOfDay(new Date(base.getFullYear(), base.getMonth() + 1, 0));

    const slots = await prisma.occupancySlot.findMany({
      where: { reportDate: { gte: monthStart, lte: monthEnd } },
      orderBy: { reportDate: 'asc' },
    });

    const byDay = new Map<string, { slots: Set<string>; truth: (typeof slots)[number] }>();
    const rank = (x: string) => (x === 'SLOT_2200' ? 3 : x === 'SLOT_1600' ? 2 : 1);
    for (const s of slots) {
      // Local-parts key: reportDate is local midnight, so this round-trips
      // correctly back into GET /occupancy?date=... on any server timezone.
      const key = localDateKey(s.reportDate);
      const entry = byDay.get(key);
      if (!entry) {
        byDay.set(key, { slots: new Set([s.slot]), truth: s });
      } else {
        entry.slots.add(s.slot);
        if (rank(s.slot) >= rank(entry.truth.slot)) entry.truth = s;
      }
    }

    const days = [...byDay.entries()].map(([date, e]) => ({
      date,
      submittedSlots: OCCUPANCY_SLOTS.filter((k) => e.slots.has(k)),
      roomsSold: e.truth.roomsSold,
      workingRooms: e.truth.workingRooms,
      revenue: e.truth.totalRevenue,
      occupancy: computeOccupancy(e.truth.roomsSold, e.truth.workingRooms),
    }));

    const totals = days.reduce(
      (acc, d) => {
        acc.revenue += d.revenue;
        acc.roomsSold += d.roomsSold;
        acc.workingRooms += d.workingRooms;
        return acc;
      },
      { revenue: 0, roomsSold: 0, workingRooms: 0 }
    );

    res.json({
      month: `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`,
      days,
      totals: {
        revenue: +totals.revenue.toFixed(2),
        roomsSold: totals.roomsSold,
        avgOccupancy:
          totals.workingRooms > 0 ? +((totals.roomsSold / totals.workingRooms) * 100).toFixed(2) : 0,
        daysReported: days.length,
      },
    });
  })
);

// ─── Analytics (source mix, per-Pujari, per-OTA) ──────────
router.get(
  '/analytics',
  asyncHandler(async (req, res) => {
    const { from, to } = req.query as Record<string, string | undefined>;
    const where: Record<string, unknown> = {};
    if (from || to) {
      where.reportDate = {
        ...(from ? { gte: startOfDay(parseDate(from)) } : {}),
        ...(to ? { lte: endOfDay(parseDate(to)) } : {}),
      };
    }

    // Use the end-of-day (10 PM) slot as the daily source of truth; fall back
    // to the latest submitted slot for the day if 10 PM isn't in yet.
    const slots = await prisma.occupancySlot.findMany({
      where,
      include: { sales: true },
      orderBy: { reportDate: 'asc' },
    });

    const byDay = new Map<string, (typeof slots)[number]>();
    for (const s of slots) {
      const key = s.reportDate.toISOString().slice(0, 10);
      const current = byDay.get(key);
      const rank = (x: string) => (x === 'SLOT_2200' ? 3 : x === 'SLOT_1600' ? 2 : 1);
      if (!current || rank(s.slot) >= rank(current.slot)) byDay.set(key, s);
    }
    const daily = [...byDay.values()];

    const pujaris = await prisma.pujari.findMany();
    const commissionByName = new Map(pujaris.map((p) => [p.name, p.commissionPct]));

    const sourceMix: Record<string, { rooms: number; revenue: number }> = {
      ONLINE: { rooms: 0, revenue: 0 },
      WALK_IN: { rooms: 0, revenue: 0 },
      PUJARI: { rooms: 0, revenue: 0 },
    };
    const byOta: Record<string, { rooms: number; revenue: number }> = {};
    const byPujari: Record<string, { rooms: number; revenue: number; commission: number }> = {};
    const byRoomType: Record<string, { rooms: number; revenue: number }> = {};
    const byRoom: Record<string, { rooms: number; revenue: number }> = {};

    let totalRooms = 0;
    let totalRevenue = 0;
    let totalWorking = 0;

    const trend = daily.map((day) => {
      totalWorking += day.workingRooms;
      for (const sale of day.sales) {
        totalRooms += 1;
        totalRevenue += sale.priceSold;
        sourceMix[sale.source] = sourceMix[sale.source] ?? { rooms: 0, revenue: 0 };
        sourceMix[sale.source].rooms += 1;
        sourceMix[sale.source].revenue += sale.priceSold;

        byRoomType[sale.roomType] = byRoomType[sale.roomType] ?? { rooms: 0, revenue: 0 };
        byRoomType[sale.roomType].rooms += 1;
        byRoomType[sale.roomType].revenue += sale.priceSold;

        byRoom[sale.roomNumber] = byRoom[sale.roomNumber] ?? { rooms: 0, revenue: 0 };
        byRoom[sale.roomNumber].rooms += 1;
        byRoom[sale.roomNumber].revenue += sale.priceSold;

        if (sale.source === 'ONLINE' && sale.sourceDetail) {
          byOta[sale.sourceDetail] = byOta[sale.sourceDetail] ?? { rooms: 0, revenue: 0 };
          byOta[sale.sourceDetail].rooms += 1;
          byOta[sale.sourceDetail].revenue += sale.priceSold;
        }
        if (sale.source === 'PUJARI' && sale.sourceDetail) {
          // Prefer the commission stamped at submit time; legacy rows
          // (before stamping existed) fall back to the current %.
          const commission =
            sale.commissionAmount ?? (sale.priceSold * (commissionByName.get(sale.sourceDetail) ?? 0)) / 100;
          byPujari[sale.sourceDetail] = byPujari[sale.sourceDetail] ?? { rooms: 0, revenue: 0, commission: 0 };
          byPujari[sale.sourceDetail].rooms += 1;
          byPujari[sale.sourceDetail].revenue += sale.priceSold;
          byPujari[sale.sourceDetail].commission += commission;
        }
      }
      return {
        date: day.reportDate,
        roomsSold: day.roomsSold,
        revenue: day.totalRevenue,
        occupancy: computeOccupancy(day.roomsSold, day.workingRooms),
      };
    });

    const round = (obj: Record<string, { revenue: number; commission?: number }>) => {
      for (const k of Object.keys(obj)) {
        obj[k].revenue = +obj[k].revenue.toFixed(2);
        if (obj[k].commission !== undefined) obj[k].commission = +obj[k].commission!.toFixed(2);
      }
      return obj;
    };

    res.json({
      totalRoomsSold: totalRooms,
      totalRevenue: +totalRevenue.toFixed(2),
      avgAdr: totalRooms > 0 ? +(totalRevenue / totalRooms).toFixed(2) : 0,
      avgOccupancy: totalWorking > 0 ? +((totalRooms / totalWorking) * 100).toFixed(2) : 0,
      sourceMix: round(sourceMix),
      byOta: round(byOta),
      byPujari: round(byPujari),
      byRoomType: round(byRoomType),
      byRoom: round(byRoom),
      trend,
    });
  })
);

export default router;
