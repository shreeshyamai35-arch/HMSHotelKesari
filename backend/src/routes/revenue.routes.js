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
var zod_1 = require("zod");
var prisma_1 = __importDefault(require("../lib/prisma"));
var asyncHandler_1 = require("../lib/asyncHandler");
var auth_1 = require("../middleware/auth");
var roles_1 = require("../constants/roles");
var dates_1 = require("../lib/dates");
var errors_1 = require("../lib/errors");
var router = (0, express_1.Router)();
router.use(auth_1.authenticate);
var canEdit = (0, auth_1.authorize)(roles_1.ROLES.ADMIN, roles_1.ROLES.REVENUE);
function computeMetrics(revenue, roomsSold, roomsAvailable) {
    var adr = roomsSold > 0 ? revenue / roomsSold : 0;
    var revpar = roomsAvailable > 0 ? revenue / roomsAvailable : 0;
    return { adr: +adr.toFixed(2), revpar: +revpar.toFixed(2) };
}
router.get('/', (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, from, to, where, records;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = req.query, from = _a.from, to = _a.to;
                where = {};
                if (from || to) {
                    where.recordDate = __assign(__assign({}, (from ? { gte: (0, dates_1.startOfDay)((0, dates_1.parseDate)(from)) } : {})), (to ? { lte: (0, dates_1.endOfDay)((0, dates_1.parseDate)(to)) } : {}));
                }
                return [4 /*yield*/, prisma_1.default.revenueRecord.findMany({
                        where: where,
                        orderBy: { recordDate: 'asc' },
                        take: 400,
                    })];
            case 1:
                records = _b.sent();
                res.json(records);
                return [2 /*return*/];
        }
    });
}); }));
var upsertSchema = zod_1.z.object({
    recordDate: zod_1.z.string(),
    revenue: zod_1.z.number().min(0),
    roomsSold: zod_1.z.number().int().min(0),
    roomsAvailable: zod_1.z.number().int().min(0),
    source: zod_1.z.enum(['MANUAL', 'PMS']).optional(),
});
router.post('/', canEdit, (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var data, recordDate, _a, adr, revpar, existing, requestedSource, record;
    var _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                data = upsertSchema.parse(req.body);
                recordDate = (0, dates_1.startOfDay)((0, dates_1.parseDate)(data.recordDate));
                _a = computeMetrics(data.revenue, data.roomsSold, data.roomsAvailable), adr = _a.adr, revpar = _a.revpar;
                return [4 /*yield*/, prisma_1.default.revenueRecord.findUnique({ where: { recordDate: recordDate } })];
            case 1:
                existing = _c.sent();
                requestedSource = (_b = data.source) !== null && _b !== void 0 ? _b : 'MANUAL';
                // Source priority: PMS > MANUAL
                // If a PMS record exists, manual entry cannot override it (unless submitted as PMS)
                if (existing && existing.source === 'PMS' && requestedSource === 'MANUAL') {
                    throw (0, errors_1.badRequest)('A PMS-sourced revenue record already exists for this date. Manual entry cannot override PMS data.');
                }
                return [4 /*yield*/, prisma_1.default.revenueRecord.upsert({
                        where: { recordDate: recordDate },
                        create: {
                            recordDate: recordDate,
                            revenue: data.revenue,
                            roomsSold: data.roomsSold,
                            roomsAvailable: data.roomsAvailable,
                            adr: adr,
                            revpar: revpar,
                            source: requestedSource,
                        },
                        update: {
                            revenue: data.revenue,
                            roomsSold: data.roomsSold,
                            roomsAvailable: data.roomsAvailable,
                            adr: adr,
                            revpar: revpar,
                            source: requestedSource,
                        },
                    })];
            case 2:
                record = _c.sent();
                res.status(201).json(record);
                return [2 /*return*/];
        }
    });
}); }));
// ─── Targets ──────────────────────────────────────────────
router.get('/targets', (0, asyncHandler_1.asyncHandler)(function (_req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var targets;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma_1.default.revenueTarget.findMany({ orderBy: [{ year: 'desc' }, { month: 'desc' }] })];
            case 1:
                targets = _a.sent();
                res.json(targets);
                return [2 /*return*/];
        }
    });
}); }));
var targetSchema = zod_1.z.object({
    year: zod_1.z.number().int().min(2000).max(2100),
    month: zod_1.z.number().int().min(1).max(12),
    targetRevenue: zod_1.z.number().min(0),
});
router.post('/targets', canEdit, (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var data, target;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                data = targetSchema.parse(req.body);
                return [4 /*yield*/, prisma_1.default.revenueTarget.upsert({
                        where: { year_month: { year: data.year, month: data.month } },
                        create: {
                            year: data.year,
                            month: data.month,
                            targetRevenue: data.targetRevenue,
                        },
                        update: { targetRevenue: data.targetRevenue },
                    })];
            case 1:
                target = _a.sent();
                res.status(201).json(target);
                return [2 /*return*/];
        }
    });
}); }));
// ─── Analytics summary ────────────────────────────────────
router.get('/analytics', (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, from, to, where, records, totalRevenue, totalRoomsSold, totalRoomsAvailable, avgAdr, avgRevpar, occupancy, targets, monthly, records_1, records_1_1, r, key, targets_1, targets_1_1, t, key;
    var e_1, _b, e_2, _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                _a = req.query, from = _a.from, to = _a.to;
                where = {};
                if (from || to) {
                    where.recordDate = __assign(__assign({}, (from ? { gte: (0, dates_1.startOfDay)((0, dates_1.parseDate)(from)) } : {})), (to ? { lte: (0, dates_1.endOfDay)((0, dates_1.parseDate)(to)) } : {}));
                }
                return [4 /*yield*/, prisma_1.default.revenueRecord.findMany({ where: where, orderBy: { recordDate: 'asc' } })];
            case 1:
                records = _d.sent();
                totalRevenue = records.reduce(function (s, r) { return s + r.revenue; }, 0);
                totalRoomsSold = records.reduce(function (s, r) { return s + r.roomsSold; }, 0);
                totalRoomsAvailable = records.reduce(function (s, r) { return s + r.roomsAvailable; }, 0);
                avgAdr = totalRoomsSold > 0 ? totalRevenue / totalRoomsSold : 0;
                avgRevpar = totalRoomsAvailable > 0 ? totalRevenue / totalRoomsAvailable : 0;
                occupancy = totalRoomsAvailable > 0 ? (totalRoomsSold / totalRoomsAvailable) * 100 : 0;
                return [4 /*yield*/, prisma_1.default.revenueTarget.findMany()];
            case 2:
                targets = _d.sent();
                monthly = {};
                try {
                    for (records_1 = __values(records), records_1_1 = records_1.next(); !records_1_1.done; records_1_1 = records_1.next()) {
                        r = records_1_1.value;
                        key = "".concat(r.recordDate.getFullYear(), "-").concat(String(r.recordDate.getMonth() + 1).padStart(2, '0'));
                        if (!monthly[key])
                            monthly[key] = { revenue: 0, target: 0 };
                        monthly[key].revenue += r.revenue;
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (records_1_1 && !records_1_1.done && (_b = records_1.return)) _b.call(records_1);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
                try {
                    for (targets_1 = __values(targets), targets_1_1 = targets_1.next(); !targets_1_1.done; targets_1_1 = targets_1.next()) {
                        t = targets_1_1.value;
                        key = "".concat(t.year, "-").concat(String(t.month).padStart(2, '0'));
                        if (!monthly[key])
                            monthly[key] = { revenue: 0, target: 0 };
                        monthly[key].target = t.targetRevenue;
                    }
                }
                catch (e_2_1) { e_2 = { error: e_2_1 }; }
                finally {
                    try {
                        if (targets_1_1 && !targets_1_1.done && (_c = targets_1.return)) _c.call(targets_1);
                    }
                    finally { if (e_2) throw e_2.error; }
                }
                res.json({
                    totalRevenue: +totalRevenue.toFixed(2),
                    avgAdr: +avgAdr.toFixed(2),
                    avgRevpar: +avgRevpar.toFixed(2),
                    occupancy: +occupancy.toFixed(2),
                    trend: records.map(function (r) { return ({
                        date: r.recordDate,
                        revenue: r.revenue,
                        adr: r.adr,
                        revpar: r.revpar,
                    }); }),
                    monthly: Object.entries(monthly)
                        .sort(function (_a, _b) {
                        var _c = __read(_a, 1), a = _c[0];
                        var _d = __read(_b, 1), b = _d[0];
                        return a.localeCompare(b);
                    })
                        .map(function (_a) {
                        var _b = __read(_a, 2), month = _b[0], v = _b[1];
                        return (__assign({ month: month }, v));
                    }),
                });
                return [2 /*return*/];
        }
    });
}); }));
exports.default = router;
