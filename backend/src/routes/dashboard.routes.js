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
var prisma_1 = __importDefault(require("../lib/prisma"));
var asyncHandler_1 = require("../lib/asyncHandler");
var auth_1 = require("../middleware/auth");
var dates_1 = require("../lib/dates");
var roles_1 = require("../constants/roles");
var WATER_TANK_SLOTS_COUNT = roles_1.WATER_TANK_SLOTS.length;
var router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/', (0, asyncHandler_1.asyncHandler)(function (_req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var now, dayStart, dayEnd, todaysReports, EXPECTED_GENSET, EXPECTED_WATER, gensetTypesDone, waterSlotsDone, checklistDone, todaysReports_1, todaysReports_1_1, r, completedScheduled, totalScheduled, pendingScheduled, _a, openComplaints, openMaintenance, totalReportsToday, recentReports;
    var e_1, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                now = new Date();
                dayStart = (0, dates_1.startOfDay)(now);
                dayEnd = (0, dates_1.endOfDay)(now);
                return [4 /*yield*/, prisma_1.default.dailyReport.findMany({
                        where: { reportDate: { gte: dayStart, lte: dayEnd } },
                        include: {
                            gensetChecks: true,
                            waterTankChecks: true,
                            checklistItems: true,
                        },
                    })];
            case 1:
                todaysReports = _c.sent();
                EXPECTED_GENSET = 2;
                EXPECTED_WATER = WATER_TANK_SLOTS_COUNT;
                gensetTypesDone = new Set();
                waterSlotsDone = new Set();
                checklistDone = 0;
                try {
                    for (todaysReports_1 = __values(todaysReports), todaysReports_1_1 = todaysReports_1.next(); !todaysReports_1_1.done; todaysReports_1_1 = todaysReports_1.next()) {
                        r = todaysReports_1_1.value;
                        r.gensetChecks.forEach(function (g) { return gensetTypesDone.add(g.type); });
                        r.waterTankChecks.forEach(function (w) { return waterSlotsDone.add(w.slot); });
                        checklistDone += r.checklistItems.length;
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (todaysReports_1_1 && !todaysReports_1_1.done && (_b = todaysReports_1.return)) _b.call(todaysReports_1);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
                completedScheduled = gensetTypesDone.size + waterSlotsDone.size;
                totalScheduled = EXPECTED_GENSET + EXPECTED_WATER;
                pendingScheduled = Math.max(0, totalScheduled - completedScheduled);
                return [4 /*yield*/, Promise.all([
                        prisma_1.default.complaint.count({ where: { status: 'OPEN' } }),
                        prisma_1.default.maintenanceIssue.count({ where: { status: 'OPEN' } }),
                        prisma_1.default.dailyReport.count({ where: { reportDate: { gte: dayStart, lte: dayEnd } } }),
                        prisma_1.default.dailyReport.findMany({
                            orderBy: { submittedAt: 'desc' },
                            take: 8,
                            select: {
                                id: true,
                                reportDate: true,
                                employeeName: true,
                                department: true,
                                submittedAt: true,
                            },
                        }),
                    ])];
            case 2:
                _a = __read.apply(void 0, [_c.sent(), 4]), openComplaints = _a[0], openMaintenance = _a[1], totalReportsToday = _a[2], recentReports = _a[3];
                res.json({
                    date: dayStart,
                    checklist: {
                        completed: completedScheduled,
                        pending: pendingScheduled,
                        total: totalScheduled,
                        gensetDone: Array.from(gensetTypesDone),
                        waterDone: Array.from(waterSlotsDone),
                        checklistItemsDone: checklistDone,
                    },
                    reportsSubmittedToday: totalReportsToday,
                    openComplaints: openComplaints,
                    openMaintenance: openMaintenance,
                    recentReports: recentReports,
                });
                return [2 /*return*/];
        }
    });
}); }));
exports.default = router;
