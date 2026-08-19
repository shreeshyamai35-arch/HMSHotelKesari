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
const errors_1 = require("../lib/errors");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
const canEdit = (0, auth_1.authorize)(roles_1.ROLES.ADMIN, roles_1.ROLES.REVENUE);
function computeMetrics(revenue, roomsSold, roomsAvailable) {
    const adr = roomsSold > 0 ? revenue / roomsSold : 0;
    const revpar = roomsAvailable > 0 ? revenue / roomsAvailable : 0;
    return { adr: +adr.toFixed(2), revpar: +revpar.toFixed(2) };
}
router.get('/', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { from, to } = req.query;
    const where = {};
    if (from || to) {
        where.recordDate = {
            ...(from ? { gte: (0, dates_1.startOfDay)((0, dates_1.parseDate)(from)) } : {}),
            ...(to ? { lte: (0, dates_1.endOfDay)((0, dates_1.parseDate)(to)) } : {}),
        };
    }
    const records = await prisma_1.default.revenueRecord.findMany({
        where,
        orderBy: { recordDate: 'asc' },
        take: 400,
    });
    res.json(records);
}));
const upsertSchema = zod_1.z.object({
    recordDate: zod_1.z.string(),
    revenue: zod_1.z.number().min(0),
    roomsSold: zod_1.z.number().int().min(0),
    roomsAvailable: zod_1.z.number().int().min(0),
    source: zod_1.z.enum(['MANUAL', 'PMS']).optional(),
});
router.post('/', canEdit, (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const data = upsertSchema.parse(req.body);
    const recordDate = (0, dates_1.startOfDay)((0, dates_1.parseDate)(data.recordDate));
    const { adr, revpar } = computeMetrics(data.revenue, data.roomsSold, data.roomsAvailable);
    // Block manual revenue creation/update when a higher-priority source exists
    const existing = await prisma_1.default.revenueRecord.findUnique({ where: { recordDate } });
    const requestedSource = data.source ?? 'MANUAL';
    // Source priority: PMS > MANUAL
    // If a PMS record exists, manual entry cannot override it (unless submitted as PMS)
    if (existing && existing.source === 'PMS' && requestedSource === 'MANUAL') {
        throw (0, errors_1.badRequest)('A PMS-sourced revenue record already exists for this date. Manual entry cannot override PMS data.');
    }
    const record = await prisma_1.default.revenueRecord.upsert({
        where: { recordDate },
        create: {
            recordDate,
            revenue: data.revenue,
            roomsSold: data.roomsSold,
            roomsAvailable: data.roomsAvailable,
            adr,
            revpar,
            source: requestedSource,
        },
        update: {
            revenue: data.revenue,
            roomsSold: data.roomsSold,
            roomsAvailable: data.roomsAvailable,
            adr,
            revpar,
            source: requestedSource,
        },
    });
    res.status(201).json(record);
}));
// ─── Targets ──────────────────────────────────────────────
router.get('/targets', (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const targets = await prisma_1.default.revenueTarget.findMany({ orderBy: [{ year: 'desc' }, { month: 'desc' }] });
    res.json(targets);
}));
const targetSchema = zod_1.z.object({
    year: zod_1.z.number().int().min(2000).max(2100),
    month: zod_1.z.number().int().min(1).max(12),
    targetRevenue: zod_1.z.number().min(0),
});
router.post('/targets', canEdit, (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const data = targetSchema.parse(req.body);
    const target = await prisma_1.default.revenueTarget.upsert({
        where: { year_month: { year: data.year, month: data.month } },
        create: {
            year: data.year,
            month: data.month,
            targetRevenue: data.targetRevenue,
        },
        update: { targetRevenue: data.targetRevenue },
    });
    res.status(201).json(target);
}));
// ─── Analytics summary ────────────────────────────────────
router.get('/analytics', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { from, to } = req.query;
    const where = {};
    if (from || to) {
        where.recordDate = {
            ...(from ? { gte: (0, dates_1.startOfDay)((0, dates_1.parseDate)(from)) } : {}),
            ...(to ? { lte: (0, dates_1.endOfDay)((0, dates_1.parseDate)(to)) } : {}),
        };
    }
    const records = await prisma_1.default.revenueRecord.findMany({ where, orderBy: { recordDate: 'asc' } });
    const totalRevenue = records.reduce((s, r) => s + r.revenue, 0);
    const totalRoomsSold = records.reduce((s, r) => s + r.roomsSold, 0);
    const totalRoomsAvailable = records.reduce((s, r) => s + r.roomsAvailable, 0);
    const avgAdr = totalRoomsSold > 0 ? totalRevenue / totalRoomsSold : 0;
    const avgRevpar = totalRoomsAvailable > 0 ? totalRevenue / totalRoomsAvailable : 0;
    const occupancy = totalRoomsAvailable > 0 ? (totalRoomsSold / totalRoomsAvailable) * 100 : 0;
    // Monthly target comparison
    const targets = await prisma_1.default.revenueTarget.findMany();
    const monthly = {};
    for (const r of records) {
        const key = `${r.recordDate.getFullYear()}-${String(r.recordDate.getMonth() + 1).padStart(2, '0')}`;
        if (!monthly[key])
            monthly[key] = { revenue: 0, target: 0 };
        monthly[key].revenue += r.revenue;
    }
    for (const t of targets) {
        const key = `${t.year}-${String(t.month).padStart(2, '0')}`;
        if (!monthly[key])
            monthly[key] = { revenue: 0, target: 0 };
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
}));
exports.default = router;
