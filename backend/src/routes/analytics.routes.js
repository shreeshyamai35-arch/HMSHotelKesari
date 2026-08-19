"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var prisma_1 = __importDefault(require("../lib/prisma"));
var asyncHandler_1 = require("../lib/asyncHandler");
var auth_1 = require("../middleware/auth");
var dates_1 = require("../lib/dates");
var roles_1 = require("../constants/roles");
var router = (0, express_1.Router)();
router.use(auth_1.authenticate);
function getSettingNumber(key) {
    return __awaiter(this, void 0, void 0, function () {
        var s, n;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, prisma_1.default.setting.findUnique({ where: { key: key } })];
                case 1:
                    s = _a.sent();
                    if (!s)
                        return [2 /*return*/, null];
                    n = parseFloat(s.value);
                    return [2 /*return*/, isNaN(n) ? null : n];
            }
        });
    });
}
function dateKey(d) {
    return d.toISOString().slice(0, 10);
}
function addDaysUTC(d, n) {
    return (0, dates_1.startOfDay)((0, dates_1.addDays)(d, n));
}
// ─── Today's Snapshot ─────────────────────────────────────
router.get('/snapshot', (0, asyncHandler_1.asyncHandler)(function (_req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var now, dayStart, dayEnd, totalRoomsSetting, todayRevenue, relevant, checkIns, checkOuts, inHouse, relevant_1, relevant_1_1, b, arr, dep, roomsAvailable, roomsSold, revenue, adr, revpar, occupancy;
    var e_1, _a;
    var _b, _c, _d, _e, _f, _g;
    return __generator(this, function (_h) {
        switch (_h.label) {
            case 0:
                now = new Date();
                dayStart = (0, dates_1.startOfDay)(now);
                dayEnd = (0, dates_1.endOfDay)(now);
                return [4 /*yield*/, getSettingNumber(roles_1.SETTING_TOTAL_ROOMS)];
            case 1:
                totalRoomsSetting = (_b = (_h.sent())) !== null && _b !== void 0 ? _b : 0;
                return [4 /*yield*/, prisma_1.default.revenueRecord.findFirst({ where: { recordDate: dayStart } })];
            case 2:
                todayRevenue = _h.sent();
                return [4 /*yield*/, prisma_1.default.booking.findMany({
                        where: {
                            status: { not: 'CANCELLED' },
                            arrivalDate: { not: null, gte: addDaysUTC(now, -30), lte: dayEnd },
                        },
                    })];
            case 3:
                relevant = _h.sent();
                checkIns = 0;
                checkOuts = 0;
                inHouse = 0;
                try {
                    for (relevant_1 = __values(relevant), relevant_1_1 = relevant_1.next(); !relevant_1_1.done; relevant_1_1 = relevant_1.next()) {
                        b = relevant_1_1.value;
                        if (!b.arrivalDate)
                            continue;
                        arr = (0, dates_1.startOfDay)(b.arrivalDate);
                        dep = addDaysUTC(arr, b.nights);
                        if (dateKey(arr) === dateKey(dayStart))
                            checkIns += b.roomsBooked;
                        if (dateKey(dep) === dateKey(dayStart))
                            checkOuts += b.roomsBooked;
                        if (arr.getTime() <= dayStart.getTime() && dep.getTime() > dayStart.getTime())
                            inHouse += b.roomsBooked;
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (relevant_1_1 && !relevant_1_1.done && (_a = relevant_1.return)) _a.call(relevant_1);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
                roomsAvailable = (_c = todayRevenue === null || todayRevenue === void 0 ? void 0 : todayRevenue.roomsAvailable) !== null && _c !== void 0 ? _c : totalRoomsSetting;
                roomsSold = (_d = todayRevenue === null || todayRevenue === void 0 ? void 0 : todayRevenue.roomsSold) !== null && _d !== void 0 ? _d : inHouse;
                revenue = (_e = todayRevenue === null || todayRevenue === void 0 ? void 0 : todayRevenue.revenue) !== null && _e !== void 0 ? _e : 0;
                adr = (_f = todayRevenue === null || todayRevenue === void 0 ? void 0 : todayRevenue.adr) !== null && _f !== void 0 ? _f : (roomsSold > 0 ? revenue / roomsSold : 0);
                revpar = (_g = todayRevenue === null || todayRevenue === void 0 ? void 0 : todayRevenue.revpar) !== null && _g !== void 0 ? _g : (roomsAvailable > 0 ? revenue / roomsAvailable : 0);
                occupancy = roomsAvailable > 0 ? (roomsSold / roomsAvailable) * 100 : 0;
                res.json({
                    date: dayStart,
                    revenue: +revenue.toFixed(2),
                    occupancy: +occupancy.toFixed(2),
                    adr: +adr.toFixed(2),
                    revpar: +revpar.toFixed(2),
                    checkIns: checkIns,
                    checkOuts: checkOuts,
                    roomsAvailable: roomsAvailable,
                    roomsSold: roomsSold,
                });
                return [2 /*return*/];
        }
    });
}); }));
// ─── Pickup Report ────────────────────────────────────────
// Pickup = bookings CREATED within a window (measured by createdAt).
router.get('/pickup', (0, asyncHandler_1.asyncHandler)(function (_req, res) { return __awaiter(void 0, void 0, void 0, function () {
    function summarize(gte, lte) {
        return __awaiter(this, void 0, void 0, function () {
            var where, rows;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        where = { status: { not: 'CANCELLED' } };
                        where.createdAt = __assign({ gte: gte }, (lte ? { lte: lte } : {}));
                        return [4 /*yield*/, prisma_1.default.booking.findMany({ where: where })];
                    case 1:
                        rows = _a.sent();
                        return [2 /*return*/, {
                                bookings: rows.length,
                                rooms: rows.reduce(function (s, b) { return s + b.roomsBooked; }, 0),
                                revenue: +rows.reduce(function (s, b) { return s + b.amount; }, 0).toFixed(2),
                            }];
                }
            });
        });
    }
    var now, dayStart, yStart, yEnd, monthStart, _a, yesterday, last7, last30, currentMonth;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                now = new Date();
                dayStart = (0, dates_1.startOfDay)(now);
                yStart = addDaysUTC(now, -1);
                yEnd = (0, dates_1.endOfDay)((0, dates_1.addDays)(now, -1));
                monthStart = (0, dates_1.startOfDay)(new Date(now.getFullYear(), now.getMonth(), 1));
                return [4 /*yield*/, Promise.all([
                        summarize(yStart, yEnd),
                        summarize(addDaysUTC(now, -7), (0, dates_1.endOfDay)(now)),
                        summarize(addDaysUTC(now, -30), (0, dates_1.endOfDay)(now)),
                        summarize(monthStart, (0, dates_1.endOfDay)(now)),
                    ])];
            case 1:
                _a = __read.apply(void 0, [_b.sent(), 4]), yesterday = _a[0], last7 = _a[1], last30 = _a[2], currentMonth = _a[3];
                res.json({ asOf: dayStart, yesterday: yesterday, last7: last7, last30: last30, currentMonth: currentMonth });
                return [2 /*return*/];
        }
    });
}); }));
// ─── Booking Window (lead-time) Analysis ──────────────────
router.get('/booking-window', (0, asyncHandler_1.asyncHandler)(function (_req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var bookings, buckets, _loop_1, bookings_1, bookings_1_1, b, totalBookings;
    var e_2, _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, prisma_1.default.booking.findMany({
                    where: { status: { not: 'CANCELLED' }, arrivalDate: { not: null } },
                })];
            case 1:
                bookings = _b.sent();
                buckets = [
                    { key: 'SAME_DAY', label: 'Same Day', min: 0, max: 0, bookings: 0, rooms: 0 },
                    { key: 'D1_3', label: '1–3 Days', min: 1, max: 3, bookings: 0, rooms: 0 },
                    { key: 'D4_7', label: '4–7 Days', min: 4, max: 7, bookings: 0, rooms: 0 },
                    { key: 'D8_15', label: '8–15 Days', min: 8, max: 15, bookings: 0, rooms: 0 },
                    { key: 'D16_30', label: '16–30 Days', min: 16, max: 30, bookings: 0, rooms: 0 },
                    { key: 'D30_PLUS', label: '30+ Days', min: 31, max: Infinity, bookings: 0, rooms: 0 },
                ];
                _loop_1 = function (b) {
                    if (!b.arrivalDate)
                        return "continue";
                    var lead = Math.max(0, Math.round(((0, dates_1.startOfDay)(b.arrivalDate).getTime() - (0, dates_1.startOfDay)(b.bookingDate).getTime()) / 86400000));
                    var bucket = buckets.find(function (x) { return lead >= x.min && lead <= x.max; });
                    if (bucket) {
                        bucket.bookings += 1;
                        bucket.rooms += b.roomsBooked;
                    }
                };
                try {
                    for (bookings_1 = __values(bookings), bookings_1_1 = bookings_1.next(); !bookings_1_1.done; bookings_1_1 = bookings_1.next()) {
                        b = bookings_1_1.value;
                        _loop_1(b);
                    }
                }
                catch (e_2_1) { e_2 = { error: e_2_1 }; }
                finally {
                    try {
                        if (bookings_1_1 && !bookings_1_1.done && (_a = bookings_1.return)) _a.call(bookings_1);
                    }
                    finally { if (e_2) throw e_2.error; }
                }
                totalBookings = buckets.reduce(function (s, x) { return s + x.bookings; }, 0);
                res.json({
                    totalBookings: totalBookings,
                    buckets: buckets.map(function (x) { return ({
                        key: x.key,
                        label: x.label,
                        bookings: x.bookings,
                        rooms: x.rooms,
                        pct: totalBookings > 0 ? +((x.bookings / totalBookings) * 100).toFixed(1) : 0,
                    }); }),
                });
                return [2 /*return*/];
        }
    });
}); }));
// ─── Revenue Calendar ─────────────────────────────────────
router.get('/calendar', (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    function tier(v) {
        if (v <= 0)
            return 'NONE';
        if (v >= highT)
            return 'HIGH';
        if (v < lowT)
            return 'LOW';
        return 'MEDIUM';
    }
    var monthParam, now, year, month, _a, y, m, monthStart, monthEnd, records, bookings, otaByDay, bookings_2, bookings_2_1, b, k, revenues, avg, overrideLow, overrideHigh, lowT, highT, byDate, daysInMonth, days, d, date, k, rec, ota;
    var e_3, _b;
    var _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                monthParam = req.query.month || '';
                now = new Date();
                year = now.getFullYear();
                month = now.getMonth();
                if (/^\d{4}-\d{2}$/.test(monthParam)) {
                    _a = __read(monthParam.split('-').map(Number), 2), y = _a[0], m = _a[1];
                    year = y;
                    month = m - 1;
                }
                monthStart = (0, dates_1.startOfDay)(new Date(year, month, 1));
                monthEnd = (0, dates_1.endOfDay)(new Date(year, month + 1, 0));
                return [4 /*yield*/, prisma_1.default.revenueRecord.findMany({
                        where: { recordDate: { gte: monthStart, lte: monthEnd } },
                        orderBy: { recordDate: 'asc' },
                    })];
            case 1:
                records = _d.sent();
                return [4 /*yield*/, prisma_1.default.booking.findMany({
                        where: { arrivalDate: { gte: monthStart, lte: monthEnd }, status: { not: 'CANCELLED' } },
                    })];
            case 2:
                bookings = _d.sent();
                otaByDay = {};
                try {
                    for (bookings_2 = __values(bookings), bookings_2_1 = bookings_2.next(); !bookings_2_1.done; bookings_2_1 = bookings_2.next()) {
                        b = bookings_2_1.value;
                        if (!b.arrivalDate)
                            continue;
                        k = dateKey((0, dates_1.startOfDay)(b.arrivalDate));
                        otaByDay[k] = (_c = otaByDay[k]) !== null && _c !== void 0 ? _c : { ota: 0, total: 0 };
                        otaByDay[k].total += b.amount;
                        if (b.source === 'OTA')
                            otaByDay[k].ota += b.amount;
                    }
                }
                catch (e_3_1) { e_3 = { error: e_3_1 }; }
                finally {
                    try {
                        if (bookings_2_1 && !bookings_2_1.done && (_b = bookings_2.return)) _b.call(bookings_2);
                    }
                    finally { if (e_3) throw e_3.error; }
                }
                revenues = records.map(function (r) { return r.revenue; }).filter(function (v) { return v > 0; });
                avg = revenues.length ? revenues.reduce(function (s, v) { return s + v; }, 0) / revenues.length : 0;
                return [4 /*yield*/, getSettingNumber(roles_1.SETTING_REVENUE_TIER_LOW)];
            case 3:
                overrideLow = _d.sent();
                return [4 /*yield*/, getSettingNumber(roles_1.SETTING_REVENUE_TIER_HIGH)];
            case 4:
                overrideHigh = _d.sent();
                lowT = overrideLow !== null && overrideLow !== void 0 ? overrideLow : avg * 0.75;
                highT = overrideHigh !== null && overrideHigh !== void 0 ? overrideHigh : avg * 1.25;
                byDate = new Map(records.map(function (r) { return [dateKey((0, dates_1.startOfDay)(r.recordDate)), r]; }));
                daysInMonth = new Date(year, month + 1, 0).getDate();
                days = [];
                for (d = 1; d <= daysInMonth; d++) {
                    date = (0, dates_1.startOfDay)(new Date(year, month, d));
                    k = dateKey(date);
                    rec = byDate.get(k);
                    ota = otaByDay[k];
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
                    year: year,
                    month: month + 1,
                    avgRevenue: +avg.toFixed(2),
                    thresholds: { low: +lowT.toFixed(2), high: +highT.toFixed(2), auto: overrideLow === null && overrideHigh === null },
                    days: days,
                });
                return [2 /*return*/];
        }
    });
}); }));
// ─── Year-on-Year Comparison ──────────────────────────────
router.get('/yoy', (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    function yearStats(y) {
        return __awaiter(this, void 0, void 0, function () {
            var start, end, records, reviews, totalRevenue, totalSold, totalAvail, avgRating, monthly, records_1, records_1_1, r;
            var e_4, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        start = (0, dates_1.startOfDay)(new Date(y, 0, 1));
                        end = (0, dates_1.endOfDay)(new Date(y, 11, 31));
                        return [4 /*yield*/, prisma_1.default.revenueRecord.findMany({ where: { recordDate: { gte: start, lte: end } } })];
                    case 1:
                        records = _b.sent();
                        return [4 /*yield*/, prisma_1.default.review.findMany({ where: { reviewedAt: { gte: start, lte: end } } })];
                    case 2:
                        reviews = _b.sent();
                        totalRevenue = records.reduce(function (s, r) { return s + r.revenue; }, 0);
                        totalSold = records.reduce(function (s, r) { return s + r.roomsSold; }, 0);
                        totalAvail = records.reduce(function (s, r) { return s + r.roomsAvailable; }, 0);
                        avgRating = reviews.length ? reviews.reduce(function (s, r) { return s + r.rating; }, 0) / reviews.length : 0;
                        monthly = Array.from({ length: 12 }, function () { return 0; });
                        try {
                            for (records_1 = __values(records), records_1_1 = records_1.next(); !records_1_1.done; records_1_1 = records_1.next()) {
                                r = records_1_1.value;
                                monthly[r.recordDate.getMonth()] += r.revenue;
                            }
                        }
                        catch (e_4_1) { e_4 = { error: e_4_1 }; }
                        finally {
                            try {
                                if (records_1_1 && !records_1_1.done && (_a = records_1.return)) _a.call(records_1);
                            }
                            finally { if (e_4) throw e_4.error; }
                        }
                        return [2 /*return*/, {
                                year: y,
                                revenue: +totalRevenue.toFixed(2),
                                occupancy: totalAvail > 0 ? +((totalSold / totalAvail) * 100).toFixed(2) : 0,
                                adr: totalSold > 0 ? +(totalRevenue / totalSold).toFixed(2) : 0,
                                revpar: totalAvail > 0 ? +(totalRevenue / totalAvail).toFixed(2) : 0,
                                reviewScore: +avgRating.toFixed(2),
                                monthly: monthly.map(function (v) { return +v.toFixed(2); }),
                            }];
                }
            });
        });
    }
    function delta(cur, prev) {
        if (prev === 0)
            return null;
        return +(((cur - prev) / prev) * 100).toFixed(1);
    }
    var now, year, _a, current, previous;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                now = new Date();
                year = /^\d{4}$/.test(req.query.year || '') ? Number(req.query.year) : now.getFullYear();
                return [4 /*yield*/, Promise.all([yearStats(year), yearStats(year - 1)])];
            case 1:
                _a = __read.apply(void 0, [_b.sent(), 2]), current = _a[0], previous = _a[1];
                res.json({
                    current: current,
                    previous: previous,
                    deltas: {
                        revenue: delta(current.revenue, previous.revenue),
                        occupancy: delta(current.occupancy, previous.occupancy),
                        adr: delta(current.adr, previous.adr),
                        revpar: delta(current.revpar, previous.revpar),
                        reviewScore: delta(current.reviewScore, previous.reviewScore),
                    },
                });
                return [2 /*return*/];
        }
    });
}); }));
exports.default = router;
