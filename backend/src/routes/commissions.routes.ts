import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { asyncHandler } from '../lib/asyncHandler';
import { authenticate, authorize } from '../middleware/auth';
import { ROLES } from '../constants/roles';
import { startOfDay, endOfDay, localDateKey } from '../lib/dates';
import { badRequest, notFound } from '../lib/errors';

const router = Router();
router.use(authenticate, authorize(ROLES.ADMIN, ROLES.REVENUE));

const adminOnly = authorize(ROLES.ADMIN);

interface PujariMonthTotals {
  rooms: number;
  revenue: number;
  commission: number;
}

/**
 * Per-Pujari totals for a month, computed from room sales. Uses the
 * end-of-day slot (latest submitted slot per day) as the daily source of
 * truth — the same rule as occupancy analytics — so a room listed in all
 * three slots counts once. Commission prefers the amount stamped at submit
 * time; legacy rows fall back to the Pujari's current %.
 */
async function computeMonthTotals(year: number, month: number) {
  const monthStart = startOfDay(new Date(year, month - 1, 1));
  const monthEnd = endOfDay(new Date(year, month, 0));

  const slots = await prisma.occupancySlot.findMany({
    where: { reportDate: { gte: monthStart, lte: monthEnd } },
    include: { sales: true },
  });

  const rank = (x: string) => (x === 'SLOT_2200' ? 3 : x === 'SLOT_1600' ? 2 : 1);
  const byDay = new Map<string, (typeof slots)[number]>();
  for (const s of slots) {
    const key = localDateKey(s.reportDate);
    const current = byDay.get(key);
    if (!current || rank(s.slot) >= rank(current.slot)) byDay.set(key, s);
  }

  const pujaris = await prisma.pujari.findMany({ orderBy: { name: 'asc' } });
  const pctByName = new Map(pujaris.map((p) => [p.name, p.commissionPct]));
  const idByName = new Map(pujaris.map((p) => [p.name, p.id]));

  // Keyed by pujariId when known, else by "name:<sourceDetail>" for legacy
  // rows whose Pujari has since been deleted.
  const totals = new Map<string, PujariMonthTotals & { pujariId: string | null; name: string }>();

  for (const day of byDay.values()) {
    for (const sale of day.sales) {
      if (sale.source !== 'PUJARI') continue;
      const name = sale.sourceDetail ?? 'Unknown';
      const pujariId = sale.pujariId ?? idByName.get(name) ?? null;
      const key = pujariId ?? `name:${name}`;
      const commission =
        sale.commissionAmount ?? (sale.priceSold * (pctByName.get(name) ?? 0)) / 100;

      const entry = totals.get(key) ?? { pujariId, name, rooms: 0, revenue: 0, commission: 0 };
      entry.rooms += 1;
      entry.revenue += sale.priceSold;
      entry.commission += commission;
      totals.set(key, entry);
    }
  }

  return { pujaris, totals };
}

// ─── Monthly summary ──────────────────────────────────────
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const year = parseInt((req.query.year as string) ?? '', 10) || new Date().getFullYear();
    const month = parseInt((req.query.month as string) ?? '', 10) || new Date().getMonth() + 1;
    if (month < 1 || month > 12) throw badRequest('month must be 1-12');

    const [{ pujaris, totals }, settlements] = await Promise.all([
      computeMonthTotals(year, month),
      prisma.pujariSettlement.findMany({ where: { year, month } }),
    ]);
    const settlementByPujari = new Map(settlements.map((s) => [s.pujariId, s]));

    // All active Pujaris appear (even with zero referrals), plus any entry
    // that has activity this month (inactive or deleted Pujaris included).
    const rows: {
      pujariId: string | null;
      name: string;
      phone: string | null;
      commissionPct: number | null;
      active: boolean;
      rooms: number;
      revenue: number;
      commission: number;
      settlement: {
        id: string;
        rooms: number;
        revenue: number;
        commission: number;
        paidAt: Date;
        paidByName: string;
      } | null;
    }[] = [];

    for (const p of pujaris) {
      const t = totals.get(p.id);
      if (!p.active && !t) continue; // hide inactive Pujaris with no activity
      const s = settlementByPujari.get(p.id) ?? null;
      rows.push({
        pujariId: p.id,
        name: p.name,
        phone: p.phone,
        commissionPct: p.commissionPct,
        active: p.active,
        rooms: t?.rooms ?? 0,
        revenue: +(t?.revenue ?? 0).toFixed(2),
        commission: +(t?.commission ?? 0).toFixed(2),
        settlement: s
          ? { id: s.id, rooms: s.rooms, revenue: s.revenue, commission: s.commission, paidAt: s.paidAt, paidByName: s.paidByName }
          : null,
      });
    }
    // Legacy activity whose Pujari record no longer exists (name-keyed).
    for (const t of totals.values()) {
      if (t.pujariId) continue; // covered by the loop above
      rows.push({
        pujariId: null,
        name: t.name,
        phone: null,
        commissionPct: null,
        active: false,
        rooms: t.rooms,
        revenue: +t.revenue.toFixed(2),
        commission: +t.commission.toFixed(2),
        settlement: null,
      });
    }

    const grand = rows.reduce(
      (acc, r) => {
        acc.rooms += r.rooms;
        acc.revenue += r.revenue;
        acc.commission += r.commission;
        return acc;
      },
      { rooms: 0, revenue: 0, commission: 0 }
    );

    res.json({
      year,
      month,
      rows,
      totals: {
        rooms: grand.rooms,
        revenue: +grand.revenue.toFixed(2),
        commission: +grand.commission.toFixed(2),
      },
    });
  })
);

// ─── Mark a month paid (freezes totals) ───────────────────
const settleSchema = z.object({
  pujariId: z.string().min(1),
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
  notes: z.string().max(500).optional().nullable(),
});

router.post(
  '/settle',
  adminOnly,
  asyncHandler(async (req, res) => {
    const data = settleSchema.parse(req.body);
    const pujari = await prisma.pujari.findUnique({ where: { id: data.pujariId } });
    if (!pujari) throw notFound('Pujari not found');

    const { totals } = await computeMonthTotals(data.year, data.month);
    const t = totals.get(data.pujariId);
    const rooms = t?.rooms ?? 0;
    const revenue = +(t?.revenue ?? 0).toFixed(2);
    const commission = +(t?.commission ?? 0).toFixed(2);

    const settlement = await prisma.pujariSettlement.upsert({
      where: { pujariId_year_month: { pujariId: data.pujariId, year: data.year, month: data.month } },
      create: {
        pujariId: data.pujariId,
        year: data.year,
        month: data.month,
        rooms,
        revenue,
        commission,
        paidByName: req.user!.name,
        notes: data.notes ?? null,
      },
      update: {
        rooms,
        revenue,
        commission,
        paidByName: req.user!.name,
        notes: data.notes ?? null,
        paidAt: new Date(),
      },
    });
    res.status(201).json(settlement);
  })
);

// ─── Undo a paid marker ───────────────────────────────────
router.delete(
  '/settle/:id',
  adminOnly,
  asyncHandler(async (req, res) => {
    const existing = await prisma.pujariSettlement.findUnique({ where: { id: req.params.id } });
    if (!existing) throw notFound('Settlement not found');
    await prisma.pujariSettlement.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  })
);

export default router;
