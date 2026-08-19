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
const dates_1 = require("../lib/dates");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
const canEdit = (0, auth_1.authorize)(roles_1.ROLES.ADMIN, roles_1.ROLES.REVENUE);
router.get('/', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { from, to, source } = req.query;
    const where = {};
    if (source)
        where.source = source;
    if (from || to) {
        where.bookingDate = {
            ...(from ? { gte: (0, dates_1.startOfDay)((0, dates_1.parseDate)(from)) } : {}),
            ...(to ? { lte: (0, dates_1.endOfDay)((0, dates_1.parseDate)(to)) } : {}),
        };
    }
    const bookings = await prisma_1.default.booking.findMany({
        where,
        orderBy: { bookingDate: 'desc' },
        take: 400,
    });
    res.json(bookings);
}));
const createSchema = zod_1.z.object({
    bookingDate: zod_1.z.string(),
    arrivalDate: zod_1.z.string().optional().nullable(),
    nights: zod_1.z.number().int().min(1).optional(),
    source: zod_1.z.enum(['DIRECT', 'OTA', 'WALK_IN', 'CORPORATE', 'PMS']),
    status: zod_1.z.enum(['CONFIRMED', 'CANCELLED', 'CHECKED_IN', 'CHECKED_OUT']).optional(),
    roomsBooked: zod_1.z.number().int().min(1).optional(),
    amount: zod_1.z.number().min(0).optional(),
    guestName: zod_1.z.string().optional().nullable(),
});
router.post('/', canEdit, (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const data = createSchema.parse(req.body);
    const booking = await prisma_1.default.booking.create({
        data: {
            bookingDate: (0, dates_1.startOfDay)((0, dates_1.parseDate)(data.bookingDate)),
            arrivalDate: data.arrivalDate ? (0, dates_1.startOfDay)((0, dates_1.parseDate)(data.arrivalDate)) : null,
            nights: data.nights ?? 1,
            source: data.source,
            status: data.status ?? 'CONFIRMED',
            roomsBooked: data.roomsBooked ?? 1,
            amount: data.amount ?? 0,
            guestName: data.guestName ?? null,
        },
    });
    res.status(201).json(booking);
}));
router.get('/analytics', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { from, to } = req.query;
    const where = {};
    if (from || to) {
        where.bookingDate = {
            ...(from ? { gte: (0, dates_1.startOfDay)((0, dates_1.parseDate)(from)) } : {}),
            ...(to ? { lte: (0, dates_1.endOfDay)((0, dates_1.parseDate)(to)) } : {}),
        };
    }
    const bookings = await prisma_1.default.booking.findMany({ where, orderBy: { bookingDate: 'asc' } });
    const bySource = {};
    const byStatus = {};
    const trendMap = {};
    for (const b of bookings) {
        bySource[b.source] = (bySource[b.source] ?? 0) + b.roomsBooked;
        byStatus[b.status] = (byStatus[b.status] ?? 0) + 1;
        const key = b.bookingDate.toISOString().slice(0, 10);
        trendMap[key] = (trendMap[key] ?? 0) + b.roomsBooked;
    }
    const totalRoomsBooked = bookings.reduce((s, b) => s + b.roomsBooked, 0);
    const cancelled = byStatus['CANCELLED'] ?? 0;
    res.json({
        totalBookings: bookings.length,
        totalRoomsBooked,
        cancellationRate: bookings.length ? +((cancelled / bookings.length) * 100).toFixed(2) : 0,
        bySource: Object.entries(bySource).map(([source, rooms]) => ({ source, rooms })),
        byStatus: Object.entries(byStatus).map(([status, count]) => ({ status, count })),
        trend: Object.entries(trendMap)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, rooms]) => ({ date, rooms })),
    });
}));
exports.default = router;
