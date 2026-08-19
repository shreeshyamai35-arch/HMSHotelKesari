"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../lib/prisma"));
const asyncHandler_1 = require("../lib/asyncHandler");
const auth_1 = require("../middleware/auth");
const dates_1 = require("../lib/dates");
const roles_1 = require("../constants/roles");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
async function getSettingNumber(key) {
    const s = await prisma_1.default.setting.findUnique({ where: { key } });
    if (!s)
        return null;
    const n = parseFloat(s.value);
    return isNaN(n) ? null : n;
}
function dateKey(d) {
    return d.toISOString().slice(0, 10);
}
function addDaysUTC(d, n) {
    return (0, dates_1.startOfDay)((0, dates_1.addDays)(d, n));
}
// ─── Today's Snapshot ─────────────────────────────────────
router.get('/snapshot', (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const now = new Date();
    const dayStart = (0, dates_1.startOfDay)(now);
    const dayEnd = (0, dates_1.endOfDay)(now);
    const totalRoomsSetting = (await getSettingNumber(roles_1.SETTING_TOTAL_ROOMS)) ?? 0;
    const todayRevenue = await prisma_1.default.revenueRecord.findFirst({ where: { recordDate: dayStart } });
    // Bookings that touch today, to derive check-ins/outs and in-house rooms.
    const relevant = await prisma_1.default.booking.findMany({
        where: {
            status: { not: 'CANCELLED' },
            arrivalDate: { not: null, gte: addDaysUTC(now, -30), lte: dayEnd },
        },
    });
    let checkIns = 0;
    let checkOuts = 0;
    let inHouse = 0;
    for (const b of relevant) {
        if (!b.arrivalDate)
            continue;
        const arr = (0, dates_1.startOfDay)(b.arrivalDate);
        const dep = addDaysUTC(arr, b.nights);
        if (dateKey(arr) === dateKey(dayStart))
            checkIns += b.roomsBooked;
        if (dateKey(dep) === dateKey(dayStart))
            checkOuts += b.roomsBooked;
        if (arr.getTime() <= dayStart.getTime() && dep.getTime() > dayStart.getTime())
            inHouse += b.roomsBooked;
    }
    const roomsAvailable = todayRevenue?.roomsAvailable ?? totalRoomsSetting;
    const roomsSold = todayRevenue?.roomsSold ?? inHouse;
    const revenue = todayRevenue?.revenue ?? 0;
    const adr = todayRevenue?.adr ?? (roomsSold > 0 ? revenue / roomsSold : 0);
    const revpar = todayRevenue?.revpar ?? (roomsAvailable > 0 ? revenue / roomsAvailable : 0);
    const occupancy = roomsAvailable > 0 ? (roomsSold / roomsAvailable) * 100 : 0;
    res.json({
        date: dayStart,
        revenue: +revenue.toFixed(2),
        occupancy: +occupancy.toFixed(2),
        adr: +adr.toFixed(2),
        revpar: +revpar.toFixed(2),
        checkIns,
        checkOuts,
        roomsAvailable,
        roomsSold,
    });
}));
// ─── Pickup Report ────────────────────────────────────────
// Pickup = bookings CREATED within a window (measured by createdAt).
router.get('/pickup', (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const now = new Date();
    const dayStart = (0, dates_1.startOfDay)(now);
    const yStart = addDaysUTC(now, -1);
    const yEnd = (0, dates_1.endOfDay)((0, dates_1.addDays)(now, -1));
    const monthStart = (0, dates_1.startOfDay)(new Date(now.getFullYear(), now.getMonth(), 1));
    async function summarize(gte, lte) {
        const where = { status: { not: 'CANCELLED' } };
        where.createdAt = { gte, ...(lte ? { lte } : {}) };
        const rows = await prisma_1.default.booking.findMany({ where });
        return {
            bookings: rows.length,
            rooms: rows.reduce((s, b) => s + b.roomsBooked, 0),
            revenue: +rows.reduce((s, b) => s + b.amount, 0).toFixed(2),
        };
    }
    const [yesterday, last7, last30, currentMonth] = await Promise.all([
        summarize(yStart, yEnd),
        summarize(addDaysUTC(now, -7), (0, dates_1.endOfDay)(now)),
        summarize(addDaysUTC(now, -30), (0, dates_1.endOfDay)(now)),
        summarize(monthStart, (0, dates_1.endOfDay)(now)),
    ]);
    res.json({ asOf: dayStart, yesterday, last7, last30, currentMonth });
}));
// ─── Booking Window (lead-time) Analysis ──────────────────
router.get('/booking-window', (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const bookings = await prisma_1.default.booking.findMany({
        where: { status: { not: 'CANCELLED' }, arrivalDate: { not: null } },
    });
    const buckets = [
        { key: 'SAME_DAY', label: 'Same Day', min: 0, max: 0, bookings: 0, rooms: 0 },
        { key: 'D1_3', label: '1–3 Days', min: 1, max: 3, bookings: 0, rooms: 0 },
        { key: 'D4_7', label: '4–7 Days', min: 4, max: 7, bookings: 0, rooms: 0 },
        { key: 'D8_15', label: '8–15 Days', min: 8, max: 15, bookings: 0, rooms: 0 },
        { key: 'D16_30', label: '16–30 Days', min: 16, max: 30, bookings: 0, rooms: 0 },
        { key: 'D30_PLUS', label: '30+ Days', min: 31, max: Infinity, bookings: 0, rooms: 0 },
    ];
    for (const b of bookings) {
        if (!b.arrivalDate)
            continue;
        const lead = Math.max(0, Math.round(((0, dates_1.startOfDay)(b.arrivalDate).getTime() - (0, dates_1.startOfDay)(b.bookingDate).getTime()) / 86400000));
        const bucket = buckets.find((x) => lead >= x.min && lead <= x.max);
        if (bucket) {
            bucket.bookings += 1;
            bucket.rooms += b.roomsBooked;
        }
    }
    const totalBookings = buckets.reduce((s, x) => s + x.bookings, 0);
    res.json({
        totalBookings,
        buckets: buckets.map((x) => ({
            key: x.key,
            label: x.label,
            bookings: x.bookings,
            rooms: x.rooms,
            pct: totalBookings > 0 ? +((x.bookings / totalBookings) * 100).toFixed(1) : 0,
        })),
    });
}));
// ─── Revenue Calendar ─────────────────────────────────────
router.get('/calendar', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const monthParam = req.query.month || '';
    const now = new Date();
    let year = now.getFullYear();
    let month = now.getMonth(); // 0-based
    if (/^\d{4}-\d{2}$/.test(monthParam)) {
        const [y, m] = monthParam.split('-').map(Number);
        year = y;
        month = m - 1;
    }
    const monthStart = (0, dates_1.startOfDay)(new Date(year, month, 1));
    const monthEnd = (0, dates_1.endOfDay)(new Date(year, month + 1, 0));
    const records = await prisma_1.default.revenueRecord.findMany({
        where: { recordDate: { gte: monthStart, lte: monthEnd } },
        orderBy: { recordDate: 'asc' },
    });
    const bookings = await prisma_1.default.booking.findMany({
        where: { arrivalDate: { gte: monthStart, lte: monthEnd }, status: { not: 'CANCELLED' } },
    });
    // OTA contribution per day (revenue).
    const otaByDay = {};
    for (const b of bookings) {
        if (!b.arrivalDate)
            continue;
        const k = dateKey((0, dates_1.startOfDay)(b.arrivalDate));
        otaByDay[k] = otaByDay[k] ?? { ota: 0, total: 0 };
        otaByDay[k].total += b.amount;
        if (b.source === 'OTA')
            otaByDay[k].ota += b.amount;
    }
    const revenues = records.map((r) => r.revenue).filter((v) => v > 0);
    const avg = revenues.length ? revenues.reduce((s, v) => s + v, 0) / revenues.length : 0;
    // Tier thresholds: admin override, else auto (relative to month average).
    const overrideLow = await getSettingNumber(roles_1.SETTING_REVENUE_TIER_LOW);
    const overrideHigh = await getSettingNumber(roles_1.SETTING_REVENUE_TIER_HIGH);
    const lowT = overrideLow ?? avg * 0.75;
    const highT = overrideHigh ?? avg * 1.25;
    function tier(v) {
        if (v <= 0)
            return 'NONE';
        if (v >= highT)
            return 'HIGH';
        if (v < lowT)
            return 'LOW';
        return 'MEDIUM';
    }
    const byDate = new Map(records.map((r) => [dateKey((0, dates_1.startOfDay)(r.recordDate)), r]));
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let d = 1; d <= daysInMonth; d++) {
        const date = (0, dates_1.startOfDay)(new Date(year, month, d));
        const k = dateKey(date);
        const rec = byDate.get(k);
        const ota = otaByDay[k];
        days.push({
            date: k,
            revenue: rec ? +rec.revenue.toFixed(2) : 0,
            occupancy: rec && rec.roomsAvailable > 0 ? +((rec.roomsSold / rec.roomsAvailable) * 100).toFixed(1) : 0,
            adr: rec ? rec.adr : 0,
            revpar: rec ? rec.revpar : 0,
            roomsSold: rec ? rec.roomsSold : 0,
            otaContribution: ota && ota.total > 0 ? +((ota.ota / ota.total) * 100).toFixed(1) : 0,
            tier: tier(rec ? rec.revenue : 0),
        });
    }
    res.json({
        year,
        month: month + 1,
        avgRevenue: +avg.toFixed(2),
        thresholds: { low: +lowT.toFixed(2), high: +highT.toFixed(2), auto: overrideLow === null && overrideHigh === null },
        days,
    });
}));
// ─── Year-on-Year Comparison ──────────────────────────────
router.get('/yoy', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const now = new Date();
    const year = /^\d{4}$/.test(req.query.year || '') ? Number(req.query.year) : now.getFullYear();
    async function yearStats(y) {
        const start = (0, dates_1.startOfDay)(new Date(y, 0, 1));
        const end = (0, dates_1.endOfDay)(new Date(y, 11, 31));
        const records = await prisma_1.default.revenueRecord.findMany({ where: { recordDate: { gte: start, lte: end } } });
        const reviews = await prisma_1.default.review.findMany({ where: { reviewedAt: { gte: start, lte: end } } });
        const totalRevenue = records.reduce((s, r) => s + r.revenue, 0);
        const totalSold = records.reduce((s, r) => s + r.roomsSold, 0);
        const totalAvail = records.reduce((s, r) => s + r.roomsAvailable, 0);
        const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
        // Monthly revenue breakdown.
        const monthly = Array.from({ length: 12 }, () => 0);
        for (const r of records)
            monthly[r.recordDate.getMonth()] += r.revenue;
        return {
            year: y,
            revenue: +totalRevenue.toFixed(2),
            occupancy: totalAvail > 0 ? +((totalSold / totalAvail) * 100).toFixed(2) : 0,
            adr: totalSold > 0 ? +(totalRevenue / totalSold).toFixed(2) : 0,
            revpar: totalAvail > 0 ? +(totalRevenue / totalAvail).toFixed(2) : 0,
            reviewScore: +avgRating.toFixed(2),
            monthly: monthly.map((v) => +v.toFixed(2)),
        };
    }
    const [current, previous] = await Promise.all([yearStats(year), yearStats(year - 1)]);
    function delta(cur, prev) {
        if (prev === 0)
            return null;
        return +(((cur - prev) / prev) * 100).toFixed(1);
    }
    res.json({
        current,
        previous,
        deltas: {
            revenue: delta(current.revenue, previous.revenue),
            occupancy: delta(current.occupancy, previous.occupancy),
            adr: delta(current.adr, previous.adr),
            revpar: delta(current.revpar, previous.revpar),
            reviewScore: delta(current.reviewScore, previous.reviewScore),
        },
    });
}));
exports.default = router;
