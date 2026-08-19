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
var roles_1 = require("../constants/roles");
var ai_service_1 = require("../services/ai.service");
var dates_1 = require("../lib/dates");
var router = (0, express_1.Router)();
router.use(auth_1.authenticate, (0, auth_1.authorize)(roles_1.ROLES.ADMIN, roles_1.ROLES.MANAGEMENT, roles_1.ROLES.REVENUE));
router.get('/insights', (0, asyncHandler_1.asyncHandler)(function (_req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var now, dayStart, dayEnd, _a, revenue, reviews, openComplaints, openMaintenance, reportsToday, totalRevenue, totalRoomsSold, totalRoomsAvailable, avgAdr, avgRevpar, occupancy, avgRating, insight;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                now = new Date();
                dayStart = (0, dates_1.startOfDay)(now);
                dayEnd = (0, dates_1.endOfDay)(now);
                return [4 /*yield*/, Promise.all([
                        prisma_1.default.revenueRecord.findMany(),
                        prisma_1.default.review.findMany(),
                        prisma_1.default.complaint.count({ where: { status: 'OPEN' } }),
                        prisma_1.default.maintenanceIssue.count({ where: { status: 'OPEN' } }),
                        prisma_1.default.dailyReport.count({ where: { reportDate: { gte: dayStart, lte: dayEnd } } }),
                    ])];
            case 1:
                _a = __read.apply(void 0, [_b.sent(), 5]), revenue = _a[0], reviews = _a[1], openComplaints = _a[2], openMaintenance = _a[3], reportsToday = _a[4];
                totalRevenue = revenue.reduce(function (s, r) { return s + r.revenue; }, 0);
                totalRoomsSold = revenue.reduce(function (s, r) { return s + r.roomsSold; }, 0);
                totalRoomsAvailable = revenue.reduce(function (s, r) { return s + r.roomsAvailable; }, 0);
                avgAdr = totalRoomsSold > 0 ? totalRevenue / totalRoomsSold : 0;
                avgRevpar = totalRoomsAvailable > 0 ? totalRevenue / totalRoomsAvailable : 0;
                occupancy = totalRoomsAvailable > 0 ? (totalRoomsSold / totalRoomsAvailable) * 100 : 0;
                avgRating = reviews.length ? reviews.reduce(function (s, r) { return s + r.rating; }, 0) / reviews.length : 0;
                return [4 /*yield*/, (0, ai_service_1.generateInsights)({
                        occupancy: occupancy,
                        totalRevenue: totalRevenue,
                        avgAdr: avgAdr,
                        avgRevpar: avgRevpar,
                        openComplaints: openComplaints,
                        openMaintenance: openMaintenance,
                        avgRating: avgRating,
                        reportsToday: reportsToday,
                    })];
            case 2:
                insight = _b.sent();
                res.json(insight);
                return [2 /*return*/];
        }
    });
}); }));
exports.default = router;
