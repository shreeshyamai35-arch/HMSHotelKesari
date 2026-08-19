"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = __importDefault(require("../lib/prisma"));
const asyncHandler_1 = require("../lib/asyncHandler");
const auth_1 = require("../middleware/auth");
const roles_1 = require("../constants/roles");
const roles_2 = require("../constants/roles");
const errors_1 = require("../lib/errors");
const rooms_1 = require("../lib/rooms");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
const adminOnly = (0, auth_1.authorize)(roles_1.ROLES.ADMIN);
async function getNumberSetting(key) {
    const s = await prisma_1.default.setting.findUnique({ where: { key } });
    if (!s)
        return null;
    const n = parseFloat(s.value);
    return isNaN(n) ? null : n;
}
// ─── Config (readable by any authenticated user) ──────────
// Powers the Occupancy Manager form dropdowns.
router.get('/config', (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const [totalRooms, rooms, roomTypes, onlineSources, pujaris] = await Promise.all([
        (0, rooms_1.getTotalRooms)(),
        (0, rooms_1.listRooms)(true),
        prisma_1.default.roomType.findMany({ where: { active: true }, orderBy: { name: 'asc' } }),
        prisma_1.default.onlineSource.findMany({ where: { active: true }, orderBy: { name: 'asc' } }),
        prisma_1.default.pujari.findMany({ where: { active: true }, orderBy: { name: 'asc' } }),
    ]);
    res.json({ totalRooms, rooms, roomTypes, onlineSources, pujaris });
}));
// Full lists (incl. inactive) for the admin settings screen.
router.get('/', adminOnly, (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const [totalRooms, rooms, roomTypes, onlineSources, pujaris, tierLow, tierHigh] = await Promise.all([
        (0, rooms_1.getTotalRooms)(),
        (0, rooms_1.listRooms)(false),
        prisma_1.default.roomType.findMany({ orderBy: { name: 'asc' } }),
        prisma_1.default.onlineSource.findMany({ orderBy: { name: 'asc' } }),
        prisma_1.default.pujari.findMany({ orderBy: { name: 'asc' } }),
        getNumberSetting(roles_2.SETTING_REVENUE_TIER_LOW),
        getNumberSetting(roles_2.SETTING_REVENUE_TIER_HIGH),
    ]);
    res.json({ totalRooms, rooms, roomTypes, onlineSources, pujaris, revenueTiers: { low: tierLow, high: tierHigh } });
}));
// ─── Revenue Calendar tier thresholds (admin override) ────
const tiersSchema = zod_1.z.object({
    low: zod_1.z.number().min(0).nullable(),
    high: zod_1.z.number().min(0).nullable(),
});
router.put('/revenue-tiers', adminOnly, (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { low, high } = tiersSchema.parse(req.body);
    async function setOrClear(key, val) {
        if (val === null) {
            await prisma_1.default.setting.deleteMany({ where: { key } });
        }
        else {
            await prisma_1.default.setting.upsert({
                where: { key },
                create: { key, value: String(val) },
                update: { value: String(val) },
            });
        }
    }
    await setOrClear(roles_2.SETTING_REVENUE_TIER_LOW, low);
    await setOrClear(roles_2.SETTING_REVENUE_TIER_HIGH, high);
    res.json({ revenueTiers: { low, high } });
}));
// ─── Total rooms ──────────────────────────────────────────
const totalRoomsSchema = zod_1.z.object({ totalRooms: zod_1.z.number().int().min(0).max(100000) });
router.put('/total-rooms', adminOnly, (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { totalRooms } = totalRoomsSchema.parse(req.body);
    const s = await prisma_1.default.setting.upsert({
        where: { key: roles_2.SETTING_TOTAL_ROOMS },
        create: { key: roles_2.SETTING_TOTAL_ROOMS, value: String(totalRooms) },
        update: { value: String(totalRooms) },
    });
    res.json({ totalRooms: parseInt(s.value, 10) });
}));
// ─── Rooms (physical room list) ───────────────────────────
const roomCreateSchema = zod_1.z.object({
    // One or many room numbers, comma-separated: "101" or "101, 102, 103".
    numbers: zod_1.z.string().min(1).max(2000),
    roomTypeId: zod_1.z.string().optional().nullable(),
});
router.post('/rooms', adminOnly, (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const data = roomCreateSchema.parse(req.body);
    const numbers = [...new Set(data.numbers.split(',').map((n) => n.trim()).filter(Boolean))];
    if (numbers.length === 0)
        throw (0, errors_1.badRequest)('Enter at least one room number.');
    if (numbers.some((n) => n.length > 20))
        throw (0, errors_1.badRequest)('Room numbers must be 20 characters or fewer.');
    if (data.roomTypeId) {
        const type = await prisma_1.default.roomType.findUnique({ where: { id: data.roomTypeId } });
        if (!type)
            throw (0, errors_1.notFound)('Room type not found');
    }
    const existing = await prisma_1.default.room.findMany({ where: { number: { in: numbers } } });
    if (existing.length > 0) {
        throw (0, errors_1.conflict)(`Room(s) already exist: ${existing.map((r) => r.number).join(', ')}`);
    }
    const created = await prisma_1.default.$transaction(numbers.map((number) => prisma_1.default.room.create({ data: { number, roomTypeId: data.roomTypeId ?? null } })));
    res.status(201).json(created);
}));
const roomPatchSchema = zod_1.z.object({
    number: zod_1.z.string().min(1).max(20).optional(),
    roomTypeId: zod_1.z.string().optional().nullable(),
    active: zod_1.z.boolean().optional(),
});
router.patch('/rooms/:id', adminOnly, (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const data = roomPatchSchema.parse(req.body);
    const existing = await prisma_1.default.room.findUnique({ where: { id: req.params.id } });
    if (!existing)
        throw (0, errors_1.notFound)('Room not found');
    const newNumber = data.number?.trim() || undefined; // ignore whitespace-only renames
    if (newNumber && newNumber !== existing.number) {
        const clash = await prisma_1.default.room.findUnique({ where: { number: newNumber } });
        if (clash)
            throw (0, errors_1.conflict)('A room with this number already exists');
    }
    if (data.roomTypeId) {
        const type = await prisma_1.default.roomType.findUnique({ where: { id: data.roomTypeId } });
        if (!type)
            throw (0, errors_1.notFound)('Room type not found');
    }
    const room = await prisma_1.default.room.update({
        where: { id: req.params.id },
        data: {
            number: newNumber,
            roomTypeId: data.roomTypeId === undefined ? undefined : data.roomTypeId ?? null,
            active: data.active,
        },
    });
    res.json(room);
}));
router.delete('/rooms/:id', adminOnly, (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const existing = await prisma_1.default.room.findUnique({ where: { id: req.params.id } });
    if (!existing)
        throw (0, errors_1.notFound)('Room not found');
    // Past RoomSales keep their number/type snapshots (roomId becomes null).
    await prisma_1.default.room.delete({ where: { id: req.params.id } });
    res.json({ success: true });
}));
// ─── Generic CRUD for the simple name-lists ───────────────
const nameSchema = zod_1.z.object({ name: zod_1.z.string().min(1).max(120), active: zod_1.z.boolean().optional() });
// Room Types
router.post('/room-types', adminOnly, (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const data = nameSchema.parse(req.body);
    const exists = await prisma_1.default.roomType.findUnique({ where: { name: data.name } });
    if (exists)
        throw (0, errors_1.conflict)('A room type with this name already exists');
    const item = await prisma_1.default.roomType.create({ data: { name: data.name } });
    res.status(201).json(item);
}));
router.patch('/room-types/:id', adminOnly, (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const data = nameSchema.partial().parse(req.body);
    const existing = await prisma_1.default.roomType.findUnique({ where: { id: req.params.id } });
    if (!existing)
        throw (0, errors_1.notFound)('Room type not found');
    const item = await prisma_1.default.roomType.update({ where: { id: req.params.id }, data });
    res.json(item);
}));
router.delete('/room-types/:id', adminOnly, (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const existing = await prisma_1.default.roomType.findUnique({ where: { id: req.params.id } });
    if (!existing)
        throw (0, errors_1.notFound)('Room type not found');
    await prisma_1.default.roomType.delete({ where: { id: req.params.id } });
    res.json({ success: true });
}));
// Online Sources (OTAs)
router.post('/online-sources', adminOnly, (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const data = nameSchema.parse(req.body);
    const exists = await prisma_1.default.onlineSource.findUnique({ where: { name: data.name } });
    if (exists)
        throw (0, errors_1.conflict)('An online source with this name already exists');
    const item = await prisma_1.default.onlineSource.create({ data: { name: data.name } });
    res.status(201).json(item);
}));
router.patch('/online-sources/:id', adminOnly, (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const data = nameSchema.partial().parse(req.body);
    const existing = await prisma_1.default.onlineSource.findUnique({ where: { id: req.params.id } });
    if (!existing)
        throw (0, errors_1.notFound)('Online source not found');
    const item = await prisma_1.default.onlineSource.update({ where: { id: req.params.id }, data });
    res.json(item);
}));
router.delete('/online-sources/:id', adminOnly, (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const existing = await prisma_1.default.onlineSource.findUnique({ where: { id: req.params.id } });
    if (!existing)
        throw (0, errors_1.notFound)('Online source not found');
    await prisma_1.default.onlineSource.delete({ where: { id: req.params.id } });
    res.json({ success: true });
}));
// Pujaris (with commission %)
const pujariSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(120),
    phone: zod_1.z.string().max(30).optional().nullable(),
    commissionPct: zod_1.z.number().min(0).max(100).optional(),
    active: zod_1.z.boolean().optional(),
});
router.post('/pujaris', adminOnly, (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const data = pujariSchema.parse(req.body);
    const exists = await prisma_1.default.pujari.findUnique({ where: { name: data.name } });
    if (exists)
        throw (0, errors_1.conflict)('A Pujari with this name already exists');
    const item = await prisma_1.default.pujari.create({
        data: {
            name: data.name,
            phone: data.phone ?? null,
            commissionPct: data.commissionPct ?? 0,
        },
    });
    res.status(201).json(item);
}));
router.patch('/pujaris/:id', adminOnly, (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const data = pujariSchema.partial().parse(req.body);
    const existing = await prisma_1.default.pujari.findUnique({ where: { id: req.params.id } });
    if (!existing)
        throw (0, errors_1.notFound)('Pujari not found');
    const item = await prisma_1.default.pujari.update({
        where: { id: req.params.id },
        data: { ...data, phone: data.phone === undefined ? undefined : data.phone ?? null },
    });
    res.json(item);
}));
router.delete('/pujaris/:id', adminOnly, (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const existing = await prisma_1.default.pujari.findUnique({ where: { id: req.params.id } });
    if (!existing)
        throw (0, errors_1.notFound)('Pujari not found');
    await prisma_1.default.pujari.delete({ where: { id: req.params.id } });
    res.json({ success: true });
}));
exports.default = router;
