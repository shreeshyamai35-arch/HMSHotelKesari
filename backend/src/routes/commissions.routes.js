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
var router = (0, express_1.Router)();
router.use(auth_1.authenticate, (0, auth_1.authorize)(roles_1.ROLES.ADMIN, roles_1.ROLES.REVENUE));
var adminOnly = (0, auth_1.authorize)(roles_1.ROLES.ADMIN);
/**
 * Per-Pujari totals for a month, computed from room sales. Uses the
 * end-of-day slot (latest submitted slot per day) as the daily source of
 * truth — the same rule as occupancy analytics — so a room listed in all
 * three slots counts once. Commission prefers the amount stamped at submit
 * time; legacy rows fall back to the Pujari's current %.
 */
function computeMonthTotals(year, month) {
    return __awaiter(this, void 0, void 0, function () {
        var monthStart, monthEnd, slots, rank, byDay, slots_1, slots_1_1, s, key, current, pujaris, pctByName, idByName, totals, _a, _b, day, _c, _d, sale, name_1, pujariId, key, commission, entry;
        var e_1, _e, e_2, _f, e_3, _g;
        var _h, _j, _k, _l, _m, _o;
        return __generator(this, function (_p) {
            switch (_p.label) {
                case 0:
                    monthStart = (0, dates_1.startOfDay)(new Date(year, month - 1, 1));
                    monthEnd = (0, dates_1.endOfDay)(new Date(year, month, 0));
                    return [4 /*yield*/, prisma_1.default.occupancySlot.findMany({
                            where: { reportDate: { gte: monthStart, lte: monthEnd } },
                            include: { sales: true },
                        })];
                case 1:
                    slots = _p.sent();
                    rank = function (x) { return (x === 'SLOT_2200' ? 3 : x === 'SLOT_1600' ? 2 : 1); };
                    byDay = new Map();
                    try {
                        for (slots_1 = __values(slots), slots_1_1 = slots_1.next(); !slots_1_1.done; slots_1_1 = slots_1.next()) {
                            s = slots_1_1.value;
                            key = (0, dates_1.localDateKey)(s.reportDate);
                            current = byDay.get(key);
                            if (!current || rank(s.slot) >= rank(current.slot))
                                byDay.set(key, s);
                        }
                    }
                    catch (e_1_1) { e_1 = { error: e_1_1 }; }
                    finally {
                        try {
                            if (slots_1_1 && !slots_1_1.done && (_e = slots_1.return)) _e.call(slots_1);
                        }
                        finally { if (e_1) throw e_1.error; }
                    }
                    return [4 /*yield*/, prisma_1.default.pujari.findMany({ orderBy: { name: 'asc' } })];
                case 2:
                    pujaris = _p.sent();
                    pctByName = new Map(pujaris.map(function (p) { return [p.name, p.commissionPct]; }));
                    idByName = new Map(pujaris.map(function (p) { return [p.name, p.id]; }));
                    totals = new Map();
                    try {
                        for (_a = __values(byDay.values()), _b = _a.next(); !_b.done; _b = _a.next()) {
                            day = _b.value;
                            try {
                                for (_c = (e_3 = void 0, __values(day.sales)), _d = _c.next(); !_d.done; _d = _c.next()) {
                                    sale = _d.value;
                                    if (sale.source !== 'PUJARI')
                                        continue;
                                    name_1 = (_h = sale.sourceDetail) !== null && _h !== void 0 ? _h : 'Unknown';
                                    pujariId = (_k = (_j = sale.pujariId) !== null && _j !== void 0 ? _j : idByName.get(name_1)) !== null && _k !== void 0 ? _k : null;
                                    key = pujariId !== null && pujariId !== void 0 ? pujariId : "name:".concat(name_1);
                                    commission = (_l = sale.commissionAmount) !== null && _l !== void 0 ? _l : (sale.priceSold * ((_m = pctByName.get(name_1)) !== null && _m !== void 0 ? _m : 0)) / 100;
                                    entry = (_o = totals.get(key)) !== null && _o !== void 0 ? _o : { pujariId: pujariId, name: name_1, rooms: 0, revenue: 0, commission: 0 };
                                    entry.rooms += 1;
                                    entry.revenue += sale.priceSold;
                                    entry.commission += commission;
                                    totals.set(key, entry);
                                }
                            }
                            catch (e_3_1) { e_3 = { error: e_3_1 }; }
                            finally {
                                try {
                                    if (_d && !_d.done && (_g = _c.return)) _g.call(_c);
                                }
                                finally { if (e_3) throw e_3.error; }
                            }
                        }
                    }
                    catch (e_2_1) { e_2 = { error: e_2_1 }; }
                    finally {
                        try {
                            if (_b && !_b.done && (_f = _a.return)) _f.call(_a);
                        }
                        finally { if (e_2) throw e_2.error; }
                    }
                    return [2 /*return*/, { pujaris: pujaris, totals: totals }];
            }
        });
    });
}
// ─── Monthly summary ──────────────────────────────────────
router.get('/', (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var year, month, _a, _b, pujaris, totals, settlements, settlementByPujari, rows, pujaris_1, pujaris_1_1, p, t, s, _c, _d, t, grand;
    var e_4, _e, e_5, _f;
    var _g, _h, _j, _k, _l, _m;
    return __generator(this, function (_o) {
        switch (_o.label) {
            case 0:
                year = parseInt((_g = req.query.year) !== null && _g !== void 0 ? _g : '', 10) || new Date().getFullYear();
                month = parseInt((_h = req.query.month) !== null && _h !== void 0 ? _h : '', 10) || new Date().getMonth() + 1;
                if (month < 1 || month > 12)
                    throw (0, errors_1.badRequest)('month must be 1-12');
                return [4 /*yield*/, Promise.all([
                        computeMonthTotals(year, month),
                        prisma_1.default.pujariSettlement.findMany({ where: { year: year, month: month } }),
                    ])];
            case 1:
                _a = __read.apply(void 0, [_o.sent(), 2]), _b = _a[0], pujaris = _b.pujaris, totals = _b.totals, settlements = _a[1];
                settlementByPujari = new Map(settlements.map(function (s) { return [s.pujariId, s]; }));
                rows = [];
                try {
                    for (pujaris_1 = __values(pujaris), pujaris_1_1 = pujaris_1.next(); !pujaris_1_1.done; pujaris_1_1 = pujaris_1.next()) {
                        p = pujaris_1_1.value;
                        t = totals.get(p.id);
                        if (!p.active && !t)
                            continue; // hide inactive Pujaris with no activity
                        s = (_j = settlementByPujari.get(p.id)) !== null && _j !== void 0 ? _j : null;
                        rows.push({
                            pujariId: p.id,
                            name: p.name,
                            phone: p.phone,
                            commissionPct: p.commissionPct,
                            active: p.active,
                            rooms: (_k = t === null || t === void 0 ? void 0 : t.rooms) !== null && _k !== void 0 ? _k : 0,
                            revenue: +((_l = t === null || t === void 0 ? void 0 : t.revenue) !== null && _l !== void 0 ? _l : 0).toFixed(2),
                            commission: +((_m = t === null || t === void 0 ? void 0 : t.commission) !== null && _m !== void 0 ? _m : 0).toFixed(2),
                            settlement: s
                                ? { id: s.id, rooms: s.rooms, revenue: s.revenue, commission: s.commission, paidAt: s.paidAt, paidByName: s.paidByName }
                                : null,
                        });
                    }
                }
                catch (e_4_1) { e_4 = { error: e_4_1 }; }
                finally {
                    try {
                        if (pujaris_1_1 && !pujaris_1_1.done && (_e = pujaris_1.return)) _e.call(pujaris_1);
                    }
                    finally { if (e_4) throw e_4.error; }
                }
                try {
                    // Legacy activity whose Pujari record no longer exists (name-keyed).
                    for (_c = __values(totals.values()), _d = _c.next(); !_d.done; _d = _c.next()) {
                        t = _d.value;
                        if (t.pujariId)
                            continue; // covered by the loop above
                        rows.push({
                            pujariId: null,
                            name: t.name,
                            phone: null,
                            commissionPct: null,
                            active: false,
                            rooms: t.rooms,
                            revenue: +t.revenue.toFixed(2),
                            commission: +t.commission.toFixed(2),
                            settlement: null,
                        });
                    }
                }
                catch (e_5_1) { e_5 = { error: e_5_1 }; }
                finally {
                    try {
                        if (_d && !_d.done && (_f = _c.return)) _f.call(_c);
                    }
                    finally { if (e_5) throw e_5.error; }
                }
                grand = rows.reduce(function (acc, r) {
                    acc.rooms += r.rooms;
                    acc.revenue += r.revenue;
                    acc.commission += r.commission;
                    return acc;
                }, { rooms: 0, revenue: 0, commission: 0 });
                res.json({
                    year: year,
                    month: month,
                    rows: rows,
                    totals: {
                        rooms: grand.rooms,
                        revenue: +grand.revenue.toFixed(2),
                        commission: +grand.commission.toFixed(2),
                    },
                });
                return [2 /*return*/];
        }
    });
}); }));
// ─── Mark a month paid (freezes totals) ───────────────────
var settleSchema = zod_1.z.object({
    pujariId: zod_1.z.string().min(1),
    year: zod_1.z.number().int().min(2000).max(2100),
    month: zod_1.z.number().int().min(1).max(12),
    notes: zod_1.z.string().max(500).optional().nullable(),
});
router.post('/settle', adminOnly, (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var data, pujari, totals, t, rooms, revenue, commission, settlement;
    var _a, _b, _c, _d, _e;
    return __generator(this, function (_f) {
        switch (_f.label) {
            case 0:
                data = settleSchema.parse(req.body);
                return [4 /*yield*/, prisma_1.default.pujari.findUnique({ where: { id: data.pujariId } })];
            case 1:
                pujari = _f.sent();
                if (!pujari)
                    throw (0, errors_1.notFound)('Pujari not found');
                return [4 /*yield*/, computeMonthTotals(data.year, data.month)];
            case 2:
                totals = (_f.sent()).totals;
                t = totals.get(data.pujariId);
                rooms = (_a = t === null || t === void 0 ? void 0 : t.rooms) !== null && _a !== void 0 ? _a : 0;
                revenue = +((_b = t === null || t === void 0 ? void 0 : t.revenue) !== null && _b !== void 0 ? _b : 0).toFixed(2);
                commission = +((_c = t === null || t === void 0 ? void 0 : t.commission) !== null && _c !== void 0 ? _c : 0).toFixed(2);
                return [4 /*yield*/, prisma_1.default.pujariSettlement.upsert({
                        where: { pujariId_year_month: { pujariId: data.pujariId, year: data.year, month: data.month } },
                        create: {
                            pujariId: data.pujariId,
                            year: data.year,
                            month: data.month,
                            rooms: rooms,
                            revenue: revenue,
                            commission: commission,
                            paidByName: req.user.name,
                            notes: (_d = data.notes) !== null && _d !== void 0 ? _d : null,
                        },
                        update: {
                            rooms: rooms,
                            revenue: revenue,
                            commission: commission,
                            paidByName: req.user.name,
                            notes: (_e = data.notes) !== null && _e !== void 0 ? _e : null,
                            paidAt: new Date(),
                        },
                    })];
            case 3:
                settlement = _f.sent();
                res.status(201).json(settlement);
                return [2 /*return*/];
        }
    });
}); }));
// ─── Undo a paid marker ───────────────────────────────────
router.delete('/settle/:id', adminOnly, (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var existing;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma_1.default.pujariSettlement.findUnique({ where: { id: req.params.id } })];
            case 1:
                existing = _a.sent();
                if (!existing)
                    throw (0, errors_1.notFound)('Settlement not found');
                return [4 /*yield*/, prisma_1.default.pujariSettlement.delete({ where: { id: req.params.id } })];
            case 2:
                _a.sent();
                res.json({ success: true });
                return [2 /*return*/];
        }
    });
}); }));
exports.default = router;
