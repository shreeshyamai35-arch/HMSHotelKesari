import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { asyncHandler } from '../lib/asyncHandler';
import { authenticate, authorize } from '../middleware/auth';
import { ROLES } from '../constants/roles';
import {
  SETTING_TOTAL_ROOMS,
  SETTING_REVENUE_TIER_LOW,
  SETTING_REVENUE_TIER_HIGH,
} from '../constants/roles';
import { notFound, conflict } from '../lib/errors';

const router = Router();
router.use(authenticate);

const adminOnly = authorize(ROLES.ADMIN);

// ─── Helpers ──────────────────────────────────────────────
async function getTotalRooms(): Promise<number> {
  const s = await prisma.setting.findUnique({ where: { key: SETTING_TOTAL_ROOMS } });
  return s ? parseInt(s.value, 10) || 0 : 0;
}

async function getNumberSetting(key: string): Promise<number | null> {
  const s = await prisma.setting.findUnique({ where: { key } });
  if (!s) return null;
  const n = parseFloat(s.value);
  return isNaN(n) ? null : n;
}

// ─── Config (readable by any authenticated user) ──────────
// Powers the Occupancy Manager form dropdowns.
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

// Full lists (incl. inactive) for the admin settings screen.
router.get(
  '/',
  adminOnly,
  asyncHandler(async (_req, res) => {
    const [totalRooms, roomTypes, onlineSources, pujaris, tierLow, tierHigh] = await Promise.all([
      getTotalRooms(),
      prisma.roomType.findMany({ orderBy: { name: 'asc' } }),
      prisma.onlineSource.findMany({ orderBy: { name: 'asc' } }),
      prisma.pujari.findMany({ orderBy: { name: 'asc' } }),
      getNumberSetting(SETTING_REVENUE_TIER_LOW),
      getNumberSetting(SETTING_REVENUE_TIER_HIGH),
    ]);
    res.json({ totalRooms, roomTypes, onlineSources, pujaris, revenueTiers: { low: tierLow, high: tierHigh } });
  })
);

// ─── Revenue Calendar tier thresholds (admin override) ────
const tiersSchema = z.object({
  low: z.number().min(0).nullable(),
  high: z.number().min(0).nullable(),
});
router.put(
  '/revenue-tiers',
  adminOnly,
  asyncHandler(async (req, res) => {
    const { low, high } = tiersSchema.parse(req.body);
    async function setOrClear(key: string, val: number | null) {
      if (val === null) {
        await prisma.setting.deleteMany({ where: { key } });
      } else {
        await prisma.setting.upsert({
          where: { key },
          create: { key, value: String(val) },
          update: { value: String(val) },
        });
      }
    }
    await setOrClear(SETTING_REVENUE_TIER_LOW, low);
    await setOrClear(SETTING_REVENUE_TIER_HIGH, high);
    res.json({ revenueTiers: { low, high } });
  })
);

// ─── Total rooms ──────────────────────────────────────────
const totalRoomsSchema = z.object({ totalRooms: z.number().int().min(0).max(100000) });

router.put(
  '/total-rooms',
  adminOnly,
  asyncHandler(async (req, res) => {
    const { totalRooms } = totalRoomsSchema.parse(req.body);
    const s = await prisma.setting.upsert({
      where: { key: SETTING_TOTAL_ROOMS },
      create: { key: SETTING_TOTAL_ROOMS, value: String(totalRooms) },
      update: { value: String(totalRooms) },
    });
    res.json({ totalRooms: parseInt(s.value, 10) });
  })
);

// ─── Generic CRUD for the simple name-lists ───────────────
const nameSchema = z.object({ name: z.string().min(1).max(120), active: z.boolean().optional() });

// Room Types
router.post(
  '/room-types',
  adminOnly,
  asyncHandler(async (req, res) => {
    const data = nameSchema.parse(req.body);
    const exists = await prisma.roomType.findUnique({ where: { name: data.name } });
    if (exists) throw conflict('A room type with this name already exists');
    const item = await prisma.roomType.create({ data: { name: data.name } });
    res.status(201).json(item);
  })
);
router.patch(
  '/room-types/:id',
  adminOnly,
  asyncHandler(async (req, res) => {
    const data = nameSchema.partial().parse(req.body);
    const existing = await prisma.roomType.findUnique({ where: { id: req.params.id } });
    if (!existing) throw notFound('Room type not found');
    const item = await prisma.roomType.update({ where: { id: req.params.id }, data });
    res.json(item);
  })
);
router.delete(
  '/room-types/:id',
  adminOnly,
  asyncHandler(async (req, res) => {
    const existing = await prisma.roomType.findUnique({ where: { id: req.params.id } });
    if (!existing) throw notFound('Room type not found');
    await prisma.roomType.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  })
);

// Online Sources (OTAs)
router.post(
  '/online-sources',
  adminOnly,
  asyncHandler(async (req, res) => {
    const data = nameSchema.parse(req.body);
    const exists = await prisma.onlineSource.findUnique({ where: { name: data.name } });
    if (exists) throw conflict('An online source with this name already exists');
    const item = await prisma.onlineSource.create({ data: { name: data.name } });
    res.status(201).json(item);
  })
);
router.patch(
  '/online-sources/:id',
  adminOnly,
  asyncHandler(async (req, res) => {
    const data = nameSchema.partial().parse(req.body);
    const existing = await prisma.onlineSource.findUnique({ where: { id: req.params.id } });
    if (!existing) throw notFound('Online source not found');
    const item = await prisma.onlineSource.update({ where: { id: req.params.id }, data });
    res.json(item);
  })
);
router.delete(
  '/online-sources/:id',
  adminOnly,
  asyncHandler(async (req, res) => {
    const existing = await prisma.onlineSource.findUnique({ where: { id: req.params.id } });
    if (!existing) throw notFound('Online source not found');
    await prisma.onlineSource.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  })
);

// Pujaris (with commission %)
const pujariSchema = z.object({
  name: z.string().min(1).max(120),
  phone: z.string().max(30).optional().nullable(),
  commissionPct: z.number().min(0).max(100).optional(),
  active: z.boolean().optional(),
});
router.post(
  '/pujaris',
  adminOnly,
  asyncHandler(async (req, res) => {
    const data = pujariSchema.parse(req.body);
    const exists = await prisma.pujari.findUnique({ where: { name: data.name } });
    if (exists) throw conflict('A Pujari with this name already exists');
    const item = await prisma.pujari.create({
      data: {
        name: data.name,
        phone: data.phone ?? null,
        commissionPct: data.commissionPct ?? 0,
      },
    });
    res.status(201).json(item);
  })
);
router.patch(
  '/pujaris/:id',
  adminOnly,
  asyncHandler(async (req, res) => {
    const data = pujariSchema.partial().parse(req.body);
    const existing = await prisma.pujari.findUnique({ where: { id: req.params.id } });
    if (!existing) throw notFound('Pujari not found');
    const item = await prisma.pujari.update({
      where: { id: req.params.id },
      data: { ...data, phone: data.phone === undefined ? undefined : data.phone ?? null },
    });
    res.json(item);
  })
);
router.delete(
  '/pujaris/:id',
  adminOnly,
  asyncHandler(async (req, res) => {
    const existing = await prisma.pujari.findUnique({ where: { id: req.params.id } });
    if (!existing) throw notFound('Pujari not found');
    await prisma.pujari.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  })
);

export default router;
