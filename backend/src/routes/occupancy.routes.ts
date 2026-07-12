import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { asyncHandler } from '../lib/asyncHandler';
import { authenticate, authorize } from '../middleware/auth';
import { ROLES, OCCUPANCY_SLOTS, ROOM_SALE_SOURCES, SETTING_TOTAL_ROOMS } from '../constants/roles';
import { parseDate, startOfDay, endOfDay } from '../lib/dates';
import { badRequest, notFound } from '../lib/errors';

const router = Router();
router.use(authenticate);

const canSubmit = authorize(ROLES.ADMIN, ROLES.FRONT_OFFICE);

async function getTotalRooms(): Promise<number> {
  const s = await prisma.setting.findUnique({ where: { key: SETTING_TOTAL_ROOMS } });
  return s ? parseInt(s.value, 10) || 0 : 0;
}

function computeOccupancy(roomsSold: number, workingRooms: number) {
  return workingRooms > 0 ? +((roomsSold / workingRooms) * 100).toFixed(2) : 0;
}

// ─── Config (form dropdowns) ──────────────────────────────
router.get(
  '/config',
  asyncHandler(async (_req, res) => {
    const [totalRooms, roomTypes, onlineSources, pujaris] = await Promise.all([
      getTotalRooms(),
      prisma.roomType.findMany({ where: { active: true }, orderBy: { name: 'asc' } }),
      prisma.onlineSource.findMany({ where: { active: true }, orderBy: { name: 'asc' } }),
      prisma.pujari.findMany({ where: { active: true }, orderBy: { name: 'asc' } }),
    ]);
    res.json({ totalRooms, roomTypes, onlineSources, pujaris });
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
  roomType: z.string().min(1),
  roomNumber: z.string().min(1),
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

    // No duplicate room numbers within a slot.
    const roomNumbers = data.sales.map((s) => s.roomNumber.trim().toLowerCase());
    const dupes = roomNumbers.filter((n, i) => roomNumbers.indexOf(n) !== i);
    if (dupes.length > 0) {
      throw badRequest(`Duplicate room number(s) in this slot: ${[...new Set(dupes)].join(', ')}`);
    }

    // Per-source detail validation.
    for (const s of data.sales) {
      if (s.source === 'ONLINE' && !s.sourceDetail) {
        throw badRequest(`Room ${s.roomNumber}: select the online source (OTA).`);
      }
      if (s.source === 'PUJARI' && !s.sourceDetail) {
        throw badRequest(`Room ${s.roomNumber}: select the Pujari.`);
      }
    }

    const roomsSold = data.sales.length;
    const totalRevenue = data.sales.reduce((sum, s) => sum + s.priceSold, 0);
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

      if (data.sales.length > 0) {
        await tx.roomSale.createMany({
          data: data.sales.map((s) => ({
            slotId: slot.id,
            roomType: s.roomType,
            roomNumber: s.roomNumber,
            source: s.source,
            sourceDetail: s.source === 'WALK_IN' ? null : s.sourceDetail ?? null,
            priceSold: s.priceSold,
          })),
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
    await prisma.occupancySlot.delete({ where: { id: req.params.id } });
    res.json({ success: true });
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

        if (sale.source === 'ONLINE' && sale.sourceDetail) {
          byOta[sale.sourceDetail] = byOta[sale.sourceDetail] ?? { rooms: 0, revenue: 0 };
          byOta[sale.sourceDetail].rooms += 1;
          byOta[sale.sourceDetail].revenue += sale.priceSold;
        }
        if (sale.source === 'PUJARI' && sale.sourceDetail) {
          const pct = commissionByName.get(sale.sourceDetail) ?? 0;
          byPujari[sale.sourceDetail] = byPujari[sale.sourceDetail] ?? { rooms: 0, revenue: 0, commission: 0 };
          byPujari[sale.sourceDetail].rooms += 1;
          byPujari[sale.sourceDetail].revenue += sale.priceSold;
          byPujari[sale.sourceDetail].commission += (sale.priceSold * pct) / 100;
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
      trend,
    });
  })
);

export default router;
