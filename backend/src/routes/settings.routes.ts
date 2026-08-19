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
import { notFound, conflict, badRequest } from '../lib/errors';
import { getTotalRooms, listRooms } from '../lib/rooms';

const router = Router();
router.use(authenticate);

const adminOnly = authorize(ROLES.ADMIN);

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

// Full lists (incl. inactive) for the admin settings screen.
router.get(
  '/',
  adminOnly,
  asyncHandler(async (_req, res) => {
    const [totalRooms, rooms, roomTypes, onlineSources, pujaris, tierLow, tierHigh] = await Promise.all([
      getTotalRooms(),
      listRooms(false),
      prisma.roomType.findMany({ orderBy: { name: 'asc' } }),
      prisma.onlineSource.findMany({ orderBy: { name: 'asc' } }),
      prisma.pujari.findMany({ orderBy: { name: 'asc' } }),
      getNumberSetting(SETTING_REVENUE_TIER_LOW),
      getNumberSetting(SETTING_REVENUE_TIER_HIGH),
    ]);
    res.json({ totalRooms, rooms, roomTypes, onlineSources, pujaris, revenueTiers: { low: tierLow, high: tierHigh } });
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

// ─── Rooms (physical room list) ───────────────────────────
const roomCreateSchema = z.object({
  // One or many room numbers, comma-separated: "101" or "101, 102, 103".
  numbers: z.string().min(1).max(2000),
  roomTypeId: z.string().optional().nullable(),
});

router.post(
  '/rooms',
  adminOnly,
  asyncHandler(async (req, res) => {
    const data = roomCreateSchema.parse(req.body);

    const numbers = [...new Set(data.numbers.split(',').map((n) => n.trim()).filter(Boolean))];
    if (numbers.length === 0) throw badRequest('Enter at least one room number.');
    if (numbers.some((n) => n.length > 20)) throw badRequest('Room numbers must be 20 characters or fewer.');

    if (data.roomTypeId) {
      const type = await prisma.roomType.findUnique({ where: { id: data.roomTypeId } });
      if (!type) throw notFound('Room type not found');
    }

    const existing = await prisma.room.findMany({ where: { number: { in: numbers } } });
    if (existing.length > 0) {
      throw conflict(`Room(s) already exist: ${existing.map((r) => r.number).join(', ')}`);
    }

    const created = await prisma.$transaction(
      numbers.map((number) =>
        prisma.room.create({ data: { number, roomTypeId: data.roomTypeId ?? null } })
      )
    );
    res.status(201).json(created);
  })
);

const roomPatchSchema = z.object({
  number: z.string().min(1).max(20).optional(),
  roomTypeId: z.string().optional().nullable(),
  active: z.boolean().optional(),
});

router.patch(
  '/rooms/:id',
  adminOnly,
  asyncHandler(async (req, res) => {
    const data = roomPatchSchema.parse(req.body);
    const existing = await prisma.room.findUnique({ where: { id: req.params.id } });
    if (!existing) throw notFound('Room not found');

    const newNumber = data.number?.trim() || undefined; // ignore whitespace-only renames
    if (newNumber && newNumber !== existing.number) {
      const clash = await prisma.room.findUnique({ where: { number: newNumber } });
      if (clash) throw conflict('A room with this number already exists');
    }
    if (data.roomTypeId) {
      const type = await prisma.roomType.findUnique({ where: { id: data.roomTypeId } });
      if (!type) throw notFound('Room type not found');
    }

    const room = await prisma.room.update({
      where: { id: req.params.id },
      data: {
        number: newNumber,
        roomTypeId: data.roomTypeId === undefined ? undefined : data.roomTypeId ?? null,
        active: data.active,
      },
    });
    res.json(room);
  })
);

router.delete(
  '/rooms/:id',
  adminOnly,
  asyncHandler(async (req, res) => {
    const existing = await prisma.room.findUnique({ where: { id: req.params.id } });
    if (!existing) throw notFound('Room not found');
    // Past RoomSales keep their number/type snapshots (roomId becomes null).
    await prisma.room.delete({ where: { id: req.params.id } });
    res.json({ success: true });
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
