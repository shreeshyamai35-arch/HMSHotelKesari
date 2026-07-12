import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { asyncHandler } from '../lib/asyncHandler';
import { authenticate, authorize } from '../middleware/auth';
import { ROLES } from '../constants/roles';
import { parseDate, startOfDay, endOfDay } from '../lib/dates';

const router = Router();
router.use(authenticate);

const canEdit = authorize(ROLES.ADMIN, ROLES.REVENUE);

function computeMetrics(revenue: number, roomsSold: number, roomsAvailable: number) {
  const adr = roomsSold > 0 ? revenue / roomsSold : 0;
  const revpar = roomsAvailable > 0 ? revenue / roomsAvailable : 0;
  return { adr: +adr.toFixed(2), revpar: +revpar.toFixed(2) };
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { from, to } = req.query as Record<string, string | undefined>;
    const where: Record<string, unknown> = {};
    if (from || to) {
      where.recordDate = {
        ...(from ? { gte: startOfDay(parseDate(from)) } : {}),
        ...(to ? { lte: endOfDay(parseDate(to)) } : {}),
      };
    }
    const records = await prisma.revenueRecord.findMany({
      where,
      orderBy: { recordDate: 'asc' },
      take: 400,
    });
    res.json(records);
  })
);

const upsertSchema = z.object({
  recordDate: z.string(),
  revenue: z.number().min(0),
  roomsSold: z.number().int().min(0),
  roomsAvailable: z.number().int().min(0),
  source: z.enum(['MANUAL', 'PMS']).optional(),
});

router.post(
  '/',
  canEdit,
  asyncHandler(async (req, res) => {
    const data = upsertSchema.parse(req.body);
    const recordDate = startOfDay(parseDate(data.recordDate));
    const { adr, revpar } = computeMetrics(data.revenue, data.roomsSold, data.roomsAvailable);

    const record = await prisma.revenueRecord.upsert({
      where: { recordDate },
      create: {
        recordDate,
        revenue: data.revenue,
        roomsSold: data.roomsSold,
        roomsAvailable: data.roomsAvailable,
        adr,
        revpar,
        source: data.source ?? 'MANUAL',
      },
      update: {
        revenue: data.revenue,
        roomsSold: data.roomsSold,
        roomsAvailable: data.roomsAvailable,
        adr,
        revpar,
        source: data.source ?? 'MANUAL',
      },
    });
    res.status(201).json(record);
  })
);

// ─── Targets ──────────────────────────────────────────────
router.get(
  '/targets',
  asyncHandler(async (_req, res) => {
    const targets = await prisma.revenueTarget.findMany({ orderBy: [{ year: 'desc' }, { month: 'desc' }] });
    res.json(targets);
  })
);

const targetSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
  targetRevenue: z.number().min(0),
});

router.post(
  '/targets',
  canEdit,
  asyncHandler(async (req, res) => {
    const data = targetSchema.parse(req.body);
    const target = await prisma.revenueTarget.upsert({
      where: { year_month: { year: data.year, month: data.month } },
      create: data,
      update: { targetRevenue: data.targetRevenue },
    });
    res.status(201).json(target);
  })
);

// ─── Analytics summary ────────────────────────────────────
router.get(
  '/analytics',
  asyncHandler(async (req, res) => {
    const { from, to } = req.query as Record<string, string | undefined>;
    const where: Record<string, unknown> = {};
    if (from || to) {
      where.recordDate = {
        ...(from ? { gte: startOfDay(parseDate(from)) } : {}),
        ...(to ? { lte: endOfDay(parseDate(to)) } : {}),
      };
    }
    const records = await prisma.revenueRecord.findMany({ where, orderBy: { recordDate: 'asc' } });

    const totalRevenue = records.reduce((s, r) => s + r.revenue, 0);
    const totalRoomsSold = records.reduce((s, r) => s + r.roomsSold, 0);
    const totalRoomsAvailable = records.reduce((s, r) => s + r.roomsAvailable, 0);
    const avgAdr = totalRoomsSold > 0 ? totalRevenue / totalRoomsSold : 0;
    const avgRevpar = totalRoomsAvailable > 0 ? totalRevenue / totalRoomsAvailable : 0;
    const occupancy = totalRoomsAvailable > 0 ? (totalRoomsSold / totalRoomsAvailable) * 100 : 0;

    // Monthly target comparison
    const targets = await prisma.revenueTarget.findMany();
    const monthly: Record<string, { revenue: number; target: number }> = {};
    for (const r of records) {
      const key = `${r.recordDate.getFullYear()}-${String(r.recordDate.getMonth() + 1).padStart(2, '0')}`;
      if (!monthly[key]) monthly[key] = { revenue: 0, target: 0 };
      monthly[key].revenue += r.revenue;
    }
    for (const t of targets) {
      const key = `${t.year}-${String(t.month).padStart(2, '0')}`;
      if (!monthly[key]) monthly[key] = { revenue: 0, target: 0 };
      monthly[key].target = t.targetRevenue;
    }

    res.json({
      totalRevenue: +totalRevenue.toFixed(2),
      avgAdr: +avgAdr.toFixed(2),
      avgRevpar: +avgRevpar.toFixed(2),
      occupancy: +occupancy.toFixed(2),
      trend: records.map((r) => ({
        date: r.recordDate,
        revenue: r.revenue,
        adr: r.adr,
        revpar: r.revpar,
      })),
      monthly: Object.entries(monthly)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, v]) => ({ month, ...v })),
    });
  })
);

export default router;
