"use strict";
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
var zod_1 = require("zod");
var prisma_1 = __importDefault(require("../lib/prisma"));
var asyncHandler_1 = require("../lib/asyncHandler");
var auth_1 = require("../middleware/auth");
var roles_1 = require("../constants/roles");
var dates_1 = require("../lib/dates");
var errors_1 = require("../lib/errors");
var pdf_generator_1 = require("../lib/pdf-generator");
var router = (0, express_1.Router)();
router.use(auth_1.authenticate);
// ADMIN, REVENUE, and MANAGEMENT can download reports
var canDownload = (0, auth_1.authorize)(roles_1.ROLES.ADMIN, roles_1.ROLES.REVENUE, roles_1.ROLES.MANAGEMENT);
// ─── Hourly Report (single slot snapshot) ────────────────────
var hourlySchema = zod_1.z.object({
    date: zod_1.z.string(),
    slot: zod_1.z.enum(['SLOT_1000', 'SLOT_1600', 'SLOT_2200']),
});
router.get('/hourly', canDownload, (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, date, slot, reportDate, slotData, slotLabels, pdf, filename;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = hourlySchema.parse(req.query), date = _a.date, slot = _a.slot;
                reportDate = (0, dates_1.startOfDay)((0, dates_1.parseDate)(date));
                return [4 /*yield*/, prisma_1.default.occupancySlot.findUnique({
                        where: {
                            reportDate_slot: { reportDate: reportDate, slot: slot },
                        },
                        include: {
                            sales: {
                                orderBy: { roomNumber: 'asc' },
                            },
                        },
                    })];
            case 1:
                slotData = _b.sent();
                if (!slotData) {
                    throw (0, errors_1.notFound)("No data found for ".concat(date, " ").concat(slot));
                }
                slotLabels = {
                    SLOT_1000: '10 AM',
                    SLOT_1600: '4 PM',
                    SLOT_2200: '10 PM',
                };
                return [4 /*yield*/, (0, pdf_generator_1.generateOccupancyPDF)({
                        title: "Hourly Occupancy Report - ".concat(slotLabels[slot]),
                        subtitle: "Date: ".concat(new Date(reportDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })),
                        data: {
                            totalRooms: slotData.totalRooms,
                            workingRooms: slotData.workingRooms,
                            outOfOrder: slotData.outOfOrder,
                            roomsSold: slotData.roomsSold,
                            revenue: slotData.totalRevenue,
                            occupancy: slotData.workingRooms > 0 ? (slotData.roomsSold / slotData.workingRooms) * 100 : 0,
                            notes: slotData.notes,
                            submittedBy: slotData.submittedByName,
                            submittedAt: slotData.submittedAt,
                            sales: slotData.sales.map(function (s) { return ({
                                roomNumber: s.roomNumber,
                                roomType: s.roomType,
                                source: s.source,
                                sourceDetail: s.sourceDetail,
                                priceSold: s.priceSold,
                            }); }),
                        },
                    })];
            case 2:
                pdf = _b.sent();
                filename = "Hourly_Report_".concat(date, "_").concat(slotLabels[slot].replace(' ', ''), ".pdf");
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', "attachment; filename=\"".concat(filename, "\""));
                res.send(pdf);
                return [2 /*return*/];
        }
    });
}); }));
// ─── Daily Report (all three slots for a date) ───────────────
var dailySchema = zod_1.z.object({
    date: zod_1.z.string(),
});
router.get('/daily', canDownload, (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var date, reportDate, slots, slotLabels, sections, totalRevenue, avgOccupancy, pdf, filename;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                date = dailySchema.parse(req.query).date;
                reportDate = (0, dates_1.startOfDay)((0, dates_1.parseDate)(date));
                return [4 /*yield*/, prisma_1.default.occupancySlot.findMany({
                        where: { reportDate: reportDate },
                        include: {
                            sales: {
                                orderBy: { roomNumber: 'asc' },
                            },
                        },
                        orderBy: { slot: 'asc' },
                    })];
            case 1:
                slots = _a.sent();
                if (slots.length === 0) {
                    throw (0, errors_1.notFound)("No data found for ".concat(date));
                }
                slotLabels = {
                    SLOT_1000: '10 AM',
                    SLOT_1600: '4 PM',
                    SLOT_2200: '10 PM',
                };
                sections = slots.map(function (slot) { return ({
                    slotLabel: slotLabels[slot.slot],
                    totalRooms: slot.totalRooms,
                    workingRooms: slot.workingRooms,
                    outOfOrder: slot.outOfOrder,
                    roomsSold: slot.roomsSold,
                    revenue: slot.totalRevenue,
                    occupancy: slot.workingRooms > 0 ? (slot.roomsSold / slot.workingRooms) * 100 : 0,
                    notes: slot.notes,
                    submittedBy: slot.submittedByName,
                    submittedAt: slot.submittedAt,
                    sales: slot.sales.map(function (s) { return ({
                        roomNumber: s.roomNumber,
                        roomType: s.roomType,
                        source: s.source,
                        sourceDetail: s.sourceDetail,
                        priceSold: s.priceSold,
                    }); }),
                }); });
                totalRevenue = slots.reduce(function (sum, s) { return sum + s.totalRevenue; }, 0);
                avgOccupancy = slots.length > 0
                    ? slots.reduce(function (sum, s) {
                        var occ = s.workingRooms > 0 ? (s.roomsSold / s.workingRooms) * 100 : 0;
                        return sum + occ;
                    }, 0) / slots.length
                    : 0;
                return [4 /*yield*/, (0, pdf_generator_1.generateOccupancyPDF)({
                        title: 'Daily Occupancy Report',
                        subtitle: "Date: ".concat(new Date(reportDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })),
                        data: {
                            slots: sections,
                            summary: {
                                totalRevenue: totalRevenue,
                                avgOccupancy: avgOccupancy,
                                slotsReported: slots.length,
                            },
                        },
                    })];
            case 2:
                pdf = _a.sent();
                filename = "Daily_Report_".concat(date, ".pdf");
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', "attachment; filename=\"".concat(filename, "\""));
                res.send(pdf);
                return [2 /*return*/];
        }
    });
}); }));
// ─── Weekly Report (7-day aggregation) ───────────────────────
var weeklySchema = zod_1.z.object({
    startDate: zod_1.z.string(),
});
router.get('/weekly', canDownload, (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var startDate, start, end, slots, byDate, slots_1, slots_1_1, slot, key, dailySummaries, weekTotalRevenue, weekAvgOccupancy, weekTotalRoomsSold, pdf, filename;
    var e_1, _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                startDate = weeklySchema.parse(req.query).startDate;
                start = (0, dates_1.startOfDay)((0, dates_1.parseDate)(startDate));
                end = (0, dates_1.endOfDay)((0, dates_1.addDays)(start, 6));
                return [4 /*yield*/, prisma_1.default.occupancySlot.findMany({
                        where: {
                            reportDate: {
                                gte: start,
                                lte: end,
                            },
                        },
                        include: {
                            sales: true,
                        },
                        orderBy: [{ reportDate: 'asc' }, { slot: 'asc' }],
                    })];
            case 1:
                slots = _b.sent();
                if (slots.length === 0) {
                    throw (0, errors_1.notFound)("No data found for week starting ".concat(startDate));
                }
                byDate = new Map();
                try {
                    for (slots_1 = __values(slots), slots_1_1 = slots_1.next(); !slots_1_1.done; slots_1_1 = slots_1.next()) {
                        slot = slots_1_1.value;
                        key = (0, dates_1.localDateKey)(slot.reportDate);
                        if (!byDate.has(key))
                            byDate.set(key, []);
                        byDate.get(key).push(slot);
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (slots_1_1 && !slots_1_1.done && (_a = slots_1.return)) _a.call(slots_1);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
                dailySummaries = Array.from(byDate.entries()).map(function (_a) {
                    var _b = __read(_a, 2), dateKey = _b[0], daySlots = _b[1];
                    var totalRevenue = daySlots.reduce(function (sum, s) { return sum + s.totalRevenue; }, 0);
                    var avgOccupancy = daySlots.reduce(function (sum, s) {
                        var occ = s.workingRooms > 0 ? (s.roomsSold / s.workingRooms) * 100 : 0;
                        return sum + occ;
                    }, 0) / daySlots.length;
                    var totalRoomsSold = daySlots.reduce(function (sum, s) { return sum + s.roomsSold; }, 0);
                    return {
                        date: dateKey,
                        slotsReported: daySlots.length,
                        totalRevenue: totalRevenue,
                        avgOccupancy: avgOccupancy,
                        totalRoomsSold: totalRoomsSold,
                    };
                });
                weekTotalRevenue = dailySummaries.reduce(function (sum, d) { return sum + d.totalRevenue; }, 0);
                weekAvgOccupancy = dailySummaries.reduce(function (sum, d) { return sum + d.avgOccupancy; }, 0) / dailySummaries.length;
                weekTotalRoomsSold = dailySummaries.reduce(function (sum, d) { return sum + d.totalRoomsSold; }, 0);
                return [4 /*yield*/, (0, pdf_generator_1.generateOccupancyPDF)({
                        title: 'Weekly Occupancy Report',
                        subtitle: "Week: ".concat(new Date(start).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), " - ").concat(new Date(end).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })),
                        data: {
                            daily: dailySummaries,
                            summary: {
                                totalRevenue: weekTotalRevenue,
                                avgOccupancy: weekAvgOccupancy,
                                totalRoomsSold: weekTotalRoomsSold,
                                daysReported: dailySummaries.length,
                            },
                        },
                    })];
            case 2:
                pdf = _b.sent();
                filename = "Weekly_Report_".concat(startDate, ".pdf");
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', "attachment; filename=\"".concat(filename, "\""));
                res.send(pdf);
                return [2 /*return*/];
        }
    });
}); }));
// ─── Monthly Report (month aggregation) ──────────────────────
var monthlySchema = zod_1.z.object({
    year: zod_1.z.coerce.number().int().min(2020).max(2100),
    month: zod_1.z.coerce.number().int().min(1).max(12),
});
router.get('/monthly', canDownload, (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, year, month, start, end, slots, byDate, slots_2, slots_2_1, slot, key, dailySummaries, monthTotalRevenue, monthAvgOccupancy, monthTotalRoomsSold, monthNames, pdf, filename;
    var e_2, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _a = monthlySchema.parse(req.query), year = _a.year, month = _a.month;
                start = (0, dates_1.startOfDay)(new Date(year, month - 1, 1));
                end = (0, dates_1.endOfDay)(new Date(year, month, 0));
                return [4 /*yield*/, prisma_1.default.occupancySlot.findMany({
                        where: {
                            reportDate: {
                                gte: start,
                                lte: end,
                            },
                        },
                        include: {
                            sales: true,
                        },
                        orderBy: [{ reportDate: 'asc' }, { slot: 'asc' }],
                    })];
            case 1:
                slots = _c.sent();
                if (slots.length === 0) {
                    throw (0, errors_1.notFound)("No data found for ".concat(year, "-").concat(String(month).padStart(2, '0')));
                }
                byDate = new Map();
                try {
                    for (slots_2 = __values(slots), slots_2_1 = slots_2.next(); !slots_2_1.done; slots_2_1 = slots_2.next()) {
                        slot = slots_2_1.value;
                        key = (0, dates_1.localDateKey)(slot.reportDate);
                        if (!byDate.has(key))
                            byDate.set(key, []);
                        byDate.get(key).push(slot);
                    }
                }
                catch (e_2_1) { e_2 = { error: e_2_1 }; }
                finally {
                    try {
                        if (slots_2_1 && !slots_2_1.done && (_b = slots_2.return)) _b.call(slots_2);
                    }
                    finally { if (e_2) throw e_2.error; }
                }
                dailySummaries = Array.from(byDate.entries()).map(function (_a) {
                    var _b = __read(_a, 2), dateKey = _b[0], daySlots = _b[1];
                    var totalRevenue = daySlots.reduce(function (sum, s) { return sum + s.totalRevenue; }, 0);
                    var avgOccupancy = daySlots.reduce(function (sum, s) {
                        var occ = s.workingRooms > 0 ? (s.roomsSold / s.workingRooms) * 100 : 0;
                        return sum + occ;
                    }, 0) / daySlots.length;
                    var totalRoomsSold = daySlots.reduce(function (sum, s) { return sum + s.roomsSold; }, 0);
                    return {
                        date: dateKey,
                        slotsReported: daySlots.length,
                        totalRevenue: totalRevenue,
                        avgOccupancy: avgOccupancy,
                        totalRoomsSold: totalRoomsSold,
                    };
                });
                monthTotalRevenue = dailySummaries.reduce(function (sum, d) { return sum + d.totalRevenue; }, 0);
                monthAvgOccupancy = dailySummaries.reduce(function (sum, d) { return sum + d.avgOccupancy; }, 0) / dailySummaries.length;
                monthTotalRoomsSold = dailySummaries.reduce(function (sum, d) { return sum + d.totalRoomsSold; }, 0);
                monthNames = [
                    'January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'
                ];
                return [4 /*yield*/, (0, pdf_generator_1.generateOccupancyPDF)({
                        title: 'Monthly Occupancy Report',
                        subtitle: "".concat(monthNames[month - 1], " ").concat(year),
                        data: {
                            daily: dailySummaries,
                            summary: {
                                totalRevenue: monthTotalRevenue,
                                avgOccupancy: monthAvgOccupancy,
                                totalRoomsSold: monthTotalRoomsSold,
                                daysReported: dailySummaries.length,
                            },
                        },
                    })];
            case 2:
                pdf = _c.sent();
                filename = "Monthly_Report_".concat(year, "-").concat(String(month).padStart(2, '0'), ".pdf");
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', "attachment; filename=\"".concat(filename, "\""));
                res.send(pdf);
                return [2 /*return*/];
        }
    });
}); }));
exports.default = router;
