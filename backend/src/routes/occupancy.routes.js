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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
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
var rooms_1 = require("../lib/rooms");
var router = (0, express_1.Router)();
router.use(auth_1.authenticate);
// Only FRONT_OFFICE and MANAGEMENT roles can submit occupancy reports
var canSubmit = (0, auth_1.authorize)(roles_1.ROLES.ADMIN, roles_1.ROLES.FRONT_OFFICE, roles_1.ROLES.MANAGEMENT);
// Map internal slot enum to SlotTime type for time window validation
var SLOT_TO_TIME = {
    'SLOT_1000': '10am',
    'SLOT_1600': '4pm',
    'SLOT_2200': '10pm',
};
function computeOccupancy(roomsSold, workingRooms) {
    return workingRooms > 0 ? +((roomsSold / workingRooms) * 100).toFixed(2) : 0;
}
// ─── Config (form dropdowns) ──────────────────────────────
router.get('/config', (0, asyncHandler_1.asyncHandler)(function (_req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, totalRooms, rooms, roomTypes, onlineSources, pujaris;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, Promise.all([
                    (0, rooms_1.getTotalRooms)(),
                    (0, rooms_1.listRooms)(true),
                    prisma_1.default.roomType.findMany({ where: { active: true }, orderBy: { name: 'asc' } }),
                    prisma_1.default.onlineSource.findMany({ where: { active: true }, orderBy: { name: 'asc' } }),
                    prisma_1.default.pujari.findMany({ where: { active: true }, orderBy: { name: 'asc' } }),
                ])];
            case 1:
                _a = __read.apply(void 0, [_b.sent(), 5]), totalRooms = _a[0], rooms = _a[1], roomTypes = _a[2], onlineSources = _a[3], pujaris = _a[4];
                res.json({ totalRooms: totalRooms, rooms: rooms, roomTypes: roomTypes, onlineSources: onlineSources, pujaris: pujaris });
                return [2 /*return*/];
        }
    });
}); }));
// ─── Slots for a date ─────────────────────────────────────
router.get('/', (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var date, slots, totalRooms, bySlot;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                date = (0, dates_1.startOfDay)((0, dates_1.parseDate)(req.query.date || undefined));
                return [4 /*yield*/, prisma_1.default.occupancySlot.findMany({
                        where: { reportDate: date },
                        include: { sales: { orderBy: { createdAt: 'asc' } } },
                    })];
            case 1:
                slots = _a.sent();
                return [4 /*yield*/, (0, rooms_1.getTotalRooms)()];
            case 2:
                totalRooms = _a.sent();
                bySlot = roles_1.OCCUPANCY_SLOTS.map(function (key) {
                    var slot = slots.find(function (s) { return s.slot === key; });
                    return {
                        slot: key,
                        submitted: !!slot,
                        data: slot
                            ? __assign(__assign({}, slot), { occupancy: computeOccupancy(slot.roomsSold, slot.workingRooms) }) : null,
                    };
                });
                res.json({ date: date, totalRooms: totalRooms, slots: bySlot });
                return [2 /*return*/];
        }
    });
}); }));
// ─── Single slot ──────────────────────────────────────────
router.get('/slot/:id', (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var slot;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma_1.default.occupancySlot.findUnique({
                    where: { id: req.params.id },
                    include: { sales: { orderBy: { createdAt: 'asc' } } },
                })];
            case 1:
                slot = _a.sent();
                if (!slot)
                    throw (0, errors_1.notFound)('Occupancy slot not found');
                res.json(__assign(__assign({}, slot), { occupancy: computeOccupancy(slot.roomsSold, slot.workingRooms) }));
                return [2 /*return*/];
        }
    });
}); }));
// ─── Create / update a slot (upsert by date + slot) ───────
var saleSchema = zod_1.z.object({
    roomId: zod_1.z.string().optional().nullable(), // set when picked from the room list
    roomType: zod_1.z.string().optional().nullable(),
    roomNumber: zod_1.z.string().optional().nullable(),
    source: zod_1.z.enum(roles_1.ROOM_SALE_SOURCES),
    sourceDetail: zod_1.z.string().optional().nullable(),
    priceSold: zod_1.z.number().min(0),
});
var upsertSchema = zod_1.z.object({
    date: zod_1.z.string(),
    slot: zod_1.z.enum(roles_1.OCCUPANCY_SLOTS),
    workingRooms: zod_1.z.number().int().min(0),
    notes: zod_1.z.string().max(1000).optional().nullable(),
    sales: zod_1.z.array(saleSchema),
});
router.post('/', canSubmit, (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var data, reportDate, totalRooms, todayIST, requestedDate, slotTime, roomIds, rooms, _a, roomById, resolvedSales, roomNumbers, dupes, resolvedSales_1, resolvedSales_1_1, s, pujariNames, pujaris, _b, pujariByName, pujariNames_1, pujariNames_1_1, name_1, roomsSold, totalRevenue, outOfOrder, result, adr, revpar, full;
    var e_1, _c, e_2, _d;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                data = upsertSchema.parse(req.body);
                reportDate = (0, dates_1.startOfDay)((0, dates_1.parseDate)(data.date));
                return [4 /*yield*/, (0, rooms_1.getTotalRooms)()];
            case 1:
                totalRooms = _e.sent();
                todayIST = (0, dates_1.istDateKey)((0, dates_1.nowIST)());
                requestedDate = data.date;
                // Block backdate and forward date submissions
                if (requestedDate !== todayIST) {
                    throw (0, errors_1.forbidden)("Cannot submit reports for ".concat(requestedDate, ". Only today's date (").concat(todayIST, ") is allowed."));
                }
                slotTime = SLOT_TO_TIME[data.slot];
                if (!slotTime) {
                    throw (0, errors_1.badRequest)("Invalid slot: ".concat(data.slot));
                }
                if (!(0, dates_1.isSlotWindowOpen)(slotTime)) {
                    throw (0, errors_1.forbidden)("The ".concat(slotTime, " slot window is not open right now. Submit during the designated time window only."));
                }
                // ── Existing validation ───────────────────────────────────
                if (totalRooms <= 0) {
                    throw (0, errors_1.badRequest)('Total rooms is not configured. Ask an Admin to set it in Settings.');
                }
                if (data.workingRooms > totalRooms) {
                    throw (0, errors_1.badRequest)("Working rooms (".concat(data.workingRooms, ") cannot exceed total rooms (").concat(totalRooms, ")."));
                }
                if (data.sales.length > data.workingRooms) {
                    throw (0, errors_1.badRequest)("Rooms sold (".concat(data.sales.length, ") cannot exceed working rooms (").concat(data.workingRooms, ")."));
                }
                roomIds = data.sales.map(function (s) { return s.roomId; }).filter(function (id) { return !!id; });
                if (!roomIds.length) return [3 /*break*/, 3];
                return [4 /*yield*/, prisma_1.default.room.findMany({ where: { id: { in: roomIds } }, include: { roomType: true } })];
            case 2:
                _a = _e.sent();
                return [3 /*break*/, 4];
            case 3:
                _a = [];
                _e.label = 4;
            case 4:
                rooms = _a;
                roomById = new Map(rooms.map(function (r) { return [r.id, r]; }));
                resolvedSales = data.sales.map(function (s) {
                    var _a, _b, _c, _d, _e, _f;
                    var room = s.roomId ? roomById.get(s.roomId) : undefined;
                    if (s.roomId && !room)
                        throw (0, errors_1.badRequest)('A selected room no longer exists. Refresh and try again.');
                    var roomNumber = ((_b = (_a = room === null || room === void 0 ? void 0 : room.number) !== null && _a !== void 0 ? _a : s.roomNumber) !== null && _b !== void 0 ? _b : '').trim();
                    var roomType = ((_e = (_d = (_c = room === null || room === void 0 ? void 0 : room.roomType) === null || _c === void 0 ? void 0 : _c.name) !== null && _d !== void 0 ? _d : s.roomType) !== null && _e !== void 0 ? _e : '').trim();
                    if (!roomNumber)
                        throw (0, errors_1.badRequest)('A room row is missing its room number.');
                    if (!roomType)
                        throw (0, errors_1.badRequest)("Room ".concat(roomNumber, ": missing room type."));
                    return __assign(__assign({}, s), { roomId: (_f = room === null || room === void 0 ? void 0 : room.id) !== null && _f !== void 0 ? _f : null, roomNumber: roomNumber, roomType: roomType });
                });
                roomNumbers = resolvedSales.map(function (s) { return s.roomNumber.toLowerCase(); });
                dupes = roomNumbers.filter(function (n, i) { return roomNumbers.indexOf(n) !== i; });
                if (dupes.length > 0) {
                    throw (0, errors_1.badRequest)("Duplicate room number(s) in this slot: ".concat(__spreadArray([], __read(new Set(dupes)), false).join(', ')));
                }
                try {
                    // Per-source detail validation.
                    for (resolvedSales_1 = __values(resolvedSales), resolvedSales_1_1 = resolvedSales_1.next(); !resolvedSales_1_1.done; resolvedSales_1_1 = resolvedSales_1.next()) {
                        s = resolvedSales_1_1.value;
                        if (s.source === 'ONLINE' && !s.sourceDetail) {
                            throw (0, errors_1.badRequest)("Room ".concat(s.roomNumber, ": select the online source (OTA)."));
                        }
                        if (s.source === 'PUJARI' && !s.sourceDetail) {
                            throw (0, errors_1.badRequest)("Room ".concat(s.roomNumber, ": select the Pujari."));
                        }
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (resolvedSales_1_1 && !resolvedSales_1_1.done && (_c = resolvedSales_1.return)) _c.call(resolvedSales_1);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
                pujariNames = __spreadArray([], __read(new Set(resolvedSales.filter(function (s) { return s.source === 'PUJARI'; }).map(function (s) { return s.sourceDetail; }))), false);
                if (!pujariNames.length) return [3 /*break*/, 6];
                return [4 /*yield*/, prisma_1.default.pujari.findMany({ where: { name: { in: pujariNames } } })];
            case 5:
                _b = _e.sent();
                return [3 /*break*/, 7];
            case 6:
                _b = [];
                _e.label = 7;
            case 7:
                pujaris = _b;
                pujariByName = new Map(pujaris.map(function (p) { return [p.name, p]; }));
                try {
                    for (pujariNames_1 = __values(pujariNames), pujariNames_1_1 = pujariNames_1.next(); !pujariNames_1_1.done; pujariNames_1_1 = pujariNames_1.next()) {
                        name_1 = pujariNames_1_1.value;
                        if (!pujariByName.has(name_1)) {
                            throw (0, errors_1.badRequest)("Pujari \"".concat(name_1, "\" not found. Refresh and try again."));
                        }
                    }
                }
                catch (e_2_1) { e_2 = { error: e_2_1 }; }
                finally {
                    try {
                        if (pujariNames_1_1 && !pujariNames_1_1.done && (_d = pujariNames_1.return)) _d.call(pujariNames_1);
                    }
                    finally { if (e_2) throw e_2.error; }
                }
                roomsSold = resolvedSales.length;
                totalRevenue = resolvedSales.reduce(function (sum, s) { return sum + s.priceSold; }, 0);
                outOfOrder = totalRooms - data.workingRooms;
                return [4 /*yield*/, prisma_1.default.$transaction(function (tx) { return __awaiter(void 0, void 0, void 0, function () {
                        var existing, base, slot;
                        var _a;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0: return [4 /*yield*/, tx.occupancySlot.findUnique({
                                        where: { reportDate_slot: { reportDate: reportDate, slot: data.slot } },
                                    })];
                                case 1:
                                    existing = _b.sent();
                                    base = {
                                        totalRooms: totalRooms,
                                        workingRooms: data.workingRooms,
                                        outOfOrder: outOfOrder,
                                        roomsSold: roomsSold,
                                        totalRevenue: totalRevenue,
                                        submittedById: req.user.sub,
                                        submittedByName: req.user.name,
                                        notes: (_a = data.notes) !== null && _a !== void 0 ? _a : null,
                                        submittedAt: new Date(),
                                    };
                                    if (!existing) return [3 /*break*/, 4];
                                    return [4 /*yield*/, tx.roomSale.deleteMany({ where: { slotId: existing.id } })];
                                case 2:
                                    _b.sent();
                                    return [4 /*yield*/, tx.occupancySlot.update({ where: { id: existing.id }, data: base })];
                                case 3:
                                    slot = _b.sent();
                                    return [3 /*break*/, 6];
                                case 4: return [4 /*yield*/, tx.occupancySlot.create({
                                        data: __assign({ reportDate: reportDate, slot: data.slot }, base),
                                    })];
                                case 5:
                                    slot = _b.sent();
                                    _b.label = 6;
                                case 6:
                                    if (!(resolvedSales.length > 0)) return [3 /*break*/, 8];
                                    return [4 /*yield*/, tx.roomSale.createMany({
                                            data: resolvedSales.map(function (s) {
                                                var _a, _b;
                                                var pujari = s.source === 'PUJARI' ? pujariByName.get(s.sourceDetail) : undefined;
                                                var pct = pujari ? pujari.commissionPct : null;
                                                return {
                                                    slotId: slot.id,
                                                    roomId: s.roomId,
                                                    roomType: s.roomType,
                                                    roomNumber: s.roomNumber,
                                                    source: s.source,
                                                    sourceDetail: s.source === 'WALK_IN' ? null : (_a = s.sourceDetail) !== null && _a !== void 0 ? _a : null,
                                                    priceSold: s.priceSold,
                                                    pujariId: (_b = pujari === null || pujari === void 0 ? void 0 : pujari.id) !== null && _b !== void 0 ? _b : null,
                                                    commissionPct: pct,
                                                    commissionAmount: pct !== null ? +((s.priceSold * pct) / 100).toFixed(2) : null,
                                                };
                                            }),
                                        })];
                                case 7:
                                    _b.sent();
                                    _b.label = 8;
                                case 8: return [2 /*return*/, slot];
                            }
                        });
                    }); })];
            case 8:
                result = _e.sent();
                if (!(data.slot === 'SLOT_2200')) return [3 /*break*/, 10];
                adr = roomsSold > 0 ? totalRevenue / roomsSold : 0;
                revpar = data.workingRooms > 0 ? totalRevenue / data.workingRooms : 0;
                return [4 /*yield*/, prisma_1.default.revenueRecord.upsert({
                        where: { recordDate: reportDate },
                        create: {
                            recordDate: reportDate,
                            revenue: totalRevenue,
                            roomsSold: roomsSold,
                            roomsAvailable: data.workingRooms,
                            adr: +adr.toFixed(2),
                            revpar: +revpar.toFixed(2),
                            source: 'MANUAL',
                        },
                        update: {
                            revenue: totalRevenue,
                            roomsSold: roomsSold,
                            roomsAvailable: data.workingRooms,
                            adr: +adr.toFixed(2),
                            revpar: +revpar.toFixed(2),
                            source: 'MANUAL',
                        },
                    })];
            case 9:
                _e.sent();
                _e.label = 10;
            case 10: return [4 /*yield*/, prisma_1.default.occupancySlot.findUnique({
                    where: { id: result.id },
                    include: { sales: { orderBy: { createdAt: 'asc' } } },
                })];
            case 11:
                full = _e.sent();
                res.status(201).json(__assign(__assign({}, full), { occupancy: computeOccupancy(roomsSold, data.workingRooms) }));
                return [2 /*return*/];
        }
    });
}); }));
// ─── Delete a slot ────────────────────────────────────────
router.delete('/slot/:id', canSubmit, (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var existing, slotTime, dateKey;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, prisma_1.default.occupancySlot.findUnique({ where: { id: req.params.id } })];
            case 1:
                existing = _b.sent();
                if (!existing)
                    throw (0, errors_1.notFound)('Occupancy slot not found');
                slotTime = SLOT_TO_TIME[existing.slot];
                dateKey = (0, dates_1.localDateKey)(existing.reportDate);
                if (slotTime && (0, dates_1.isSlotLocked)(slotTime, dateKey)) {
                    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== roles_1.ROLES.ADMIN) {
                        throw (0, errors_1.forbidden)("This slot is locked (time window has passed). Only admins can delete locked slots.");
                    }
                }
                return [4 /*yield*/, prisma_1.default.occupancySlot.delete({ where: { id: req.params.id } })];
            case 2:
                _b.sent();
                if (!(existing.slot === 'SLOT_2200')) return [3 /*break*/, 4];
                return [4 /*yield*/, prisma_1.default.revenueRecord.deleteMany({
                        where: { recordDate: existing.reportDate, source: 'MANUAL' },
                    })];
            case 3:
                _b.sent();
                _b.label = 4;
            case 4:
                res.json({ success: true });
                return [2 /*return*/];
        }
    });
}); }));
// ─── Month history (day-by-day summary) ───────────────────
router.get('/history', (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var monthStr, base, monthStart, monthEnd, slots, byDay, rank, slots_1, slots_1_1, s, key, entry, days, totals;
    var e_3, _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                monthStr = req.query.month || undefined;
                base = monthStr ? (0, dates_1.parseDate)("".concat(monthStr, "-01")) : new Date();
                monthStart = (0, dates_1.startOfDay)(new Date(base.getFullYear(), base.getMonth(), 1));
                monthEnd = (0, dates_1.endOfDay)(new Date(base.getFullYear(), base.getMonth() + 1, 0));
                return [4 /*yield*/, prisma_1.default.occupancySlot.findMany({
                        where: { reportDate: { gte: monthStart, lte: monthEnd } },
                        orderBy: { reportDate: 'asc' },
                    })];
            case 1:
                slots = _b.sent();
                byDay = new Map();
                rank = function (x) { return (x === 'SLOT_2200' ? 3 : x === 'SLOT_1600' ? 2 : 1); };
                try {
                    for (slots_1 = __values(slots), slots_1_1 = slots_1.next(); !slots_1_1.done; slots_1_1 = slots_1.next()) {
                        s = slots_1_1.value;
                        key = (0, dates_1.localDateKey)(s.reportDate);
                        entry = byDay.get(key);
                        if (!entry) {
                            byDay.set(key, { slots: new Set([s.slot]), truth: s });
                        }
                        else {
                            entry.slots.add(s.slot);
                            if (rank(s.slot) >= rank(entry.truth.slot))
                                entry.truth = s;
                        }
                    }
                }
                catch (e_3_1) { e_3 = { error: e_3_1 }; }
                finally {
                    try {
                        if (slots_1_1 && !slots_1_1.done && (_a = slots_1.return)) _a.call(slots_1);
                    }
                    finally { if (e_3) throw e_3.error; }
                }
                days = __spreadArray([], __read(byDay.entries()), false).map(function (_a) {
                    var _b = __read(_a, 2), date = _b[0], e = _b[1];
                    return ({
                        date: date,
                        submittedSlots: roles_1.OCCUPANCY_SLOTS.filter(function (k) { return e.slots.has(k); }),
                        roomsSold: e.truth.roomsSold,
                        workingRooms: e.truth.workingRooms,
                        revenue: e.truth.totalRevenue,
                        occupancy: computeOccupancy(e.truth.roomsSold, e.truth.workingRooms),
                    });
                });
                totals = days.reduce(function (acc, d) {
                    acc.revenue += d.revenue;
                    acc.roomsSold += d.roomsSold;
                    acc.workingRooms += d.workingRooms;
                    return acc;
                }, { revenue: 0, roomsSold: 0, workingRooms: 0 });
                res.json({
                    month: "".concat(monthStart.getFullYear(), "-").concat(String(monthStart.getMonth() + 1).padStart(2, '0')),
                    days: days,
                    totals: {
                        revenue: +totals.revenue.toFixed(2),
                        roomsSold: totals.roomsSold,
                        avgOccupancy: totals.workingRooms > 0 ? +((totals.roomsSold / totals.workingRooms) * 100).toFixed(2) : 0,
                        daysReported: days.length,
                    },
                });
                return [2 /*return*/];
        }
    });
}); }));
// ─── Analytics (source mix, per-Pujari, per-OTA) ──────────
router.get('/analytics', (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, from, to, where, slots, byDay, slots_2, slots_2_1, s, key, current, rank, daily, pujaris, commissionByName, sourceMix, byOta, byPujari, byRoomType, byRoom, totalRooms, totalRevenue, totalWorking, trend, round;
    var e_4, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _a = req.query, from = _a.from, to = _a.to;
                where = {};
                if (from || to) {
                    where.reportDate = __assign(__assign({}, (from ? { gte: (0, dates_1.startOfDay)((0, dates_1.parseDate)(from)) } : {})), (to ? { lte: (0, dates_1.endOfDay)((0, dates_1.parseDate)(to)) } : {}));
                }
                return [4 /*yield*/, prisma_1.default.occupancySlot.findMany({
                        where: where,
                        include: { sales: true },
                        orderBy: { reportDate: 'asc' },
                    })];
            case 1:
                slots = _c.sent();
                byDay = new Map();
                try {
                    for (slots_2 = __values(slots), slots_2_1 = slots_2.next(); !slots_2_1.done; slots_2_1 = slots_2.next()) {
                        s = slots_2_1.value;
                        key = s.reportDate.toISOString().slice(0, 10);
                        current = byDay.get(key);
                        rank = function (x) { return (x === 'SLOT_2200' ? 3 : x === 'SLOT_1600' ? 2 : 1); };
                        if (!current || rank(s.slot) >= rank(current.slot))
                            byDay.set(key, s);
                    }
                }
                catch (e_4_1) { e_4 = { error: e_4_1 }; }
                finally {
                    try {
                        if (slots_2_1 && !slots_2_1.done && (_b = slots_2.return)) _b.call(slots_2);
                    }
                    finally { if (e_4) throw e_4.error; }
                }
                daily = __spreadArray([], __read(byDay.values()), false);
                return [4 /*yield*/, prisma_1.default.pujari.findMany()];
            case 2:
                pujaris = _c.sent();
                commissionByName = new Map(pujaris.map(function (p) { return [p.name, p.commissionPct]; }));
                sourceMix = {
                    ONLINE: { rooms: 0, revenue: 0 },
                    WALK_IN: { rooms: 0, revenue: 0 },
                    PUJARI: { rooms: 0, revenue: 0 },
                };
                byOta = {};
                byPujari = {};
                byRoomType = {};
                byRoom = {};
                totalRooms = 0;
                totalRevenue = 0;
                totalWorking = 0;
                trend = daily.map(function (day) {
                    var e_5, _a;
                    var _b, _c, _d, _e, _f, _g, _h;
                    totalWorking += day.workingRooms;
                    try {
                        for (var _j = __values(day.sales), _k = _j.next(); !_k.done; _k = _j.next()) {
                            var sale = _k.value;
                            totalRooms += 1;
                            totalRevenue += sale.priceSold;
                            sourceMix[sale.source] = (_b = sourceMix[sale.source]) !== null && _b !== void 0 ? _b : { rooms: 0, revenue: 0 };
                            sourceMix[sale.source].rooms += 1;
                            sourceMix[sale.source].revenue += sale.priceSold;
                            byRoomType[sale.roomType] = (_c = byRoomType[sale.roomType]) !== null && _c !== void 0 ? _c : { rooms: 0, revenue: 0 };
                            byRoomType[sale.roomType].rooms += 1;
                            byRoomType[sale.roomType].revenue += sale.priceSold;
                            byRoom[sale.roomNumber] = (_d = byRoom[sale.roomNumber]) !== null && _d !== void 0 ? _d : { rooms: 0, revenue: 0 };
                            byRoom[sale.roomNumber].rooms += 1;
                            byRoom[sale.roomNumber].revenue += sale.priceSold;
                            if (sale.source === 'ONLINE' && sale.sourceDetail) {
                                byOta[sale.sourceDetail] = (_e = byOta[sale.sourceDetail]) !== null && _e !== void 0 ? _e : { rooms: 0, revenue: 0 };
                                byOta[sale.sourceDetail].rooms += 1;
                                byOta[sale.sourceDetail].revenue += sale.priceSold;
                            }
                            if (sale.source === 'PUJARI' && sale.sourceDetail) {
                                // Prefer the commission stamped at submit time; legacy rows
                                // (before stamping existed) fall back to the current %.
                                var commission = (_f = sale.commissionAmount) !== null && _f !== void 0 ? _f : (sale.priceSold * ((_g = commissionByName.get(sale.sourceDetail)) !== null && _g !== void 0 ? _g : 0)) / 100;
                                byPujari[sale.sourceDetail] = (_h = byPujari[sale.sourceDetail]) !== null && _h !== void 0 ? _h : { rooms: 0, revenue: 0, commission: 0 };
                                byPujari[sale.sourceDetail].rooms += 1;
                                byPujari[sale.sourceDetail].revenue += sale.priceSold;
                                byPujari[sale.sourceDetail].commission += commission;
                            }
                        }
                    }
                    catch (e_5_1) { e_5 = { error: e_5_1 }; }
                    finally {
                        try {
                            if (_k && !_k.done && (_a = _j.return)) _a.call(_j);
                        }
                        finally { if (e_5) throw e_5.error; }
                    }
                    return {
                        date: day.reportDate,
                        roomsSold: day.roomsSold,
                        revenue: day.totalRevenue,
                        occupancy: computeOccupancy(day.roomsSold, day.workingRooms),
                    };
                });
                round = function (obj) {
                    var e_6, _a;
                    try {
                        for (var _b = __values(Object.keys(obj)), _c = _b.next(); !_c.done; _c = _b.next()) {
                            var k = _c.value;
                            obj[k].revenue = +obj[k].revenue.toFixed(2);
                            if (obj[k].commission !== undefined)
                                obj[k].commission = +obj[k].commission.toFixed(2);
                        }
                    }
                    catch (e_6_1) { e_6 = { error: e_6_1 }; }
                    finally {
                        try {
                            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                        }
                        finally { if (e_6) throw e_6.error; }
                    }
                    return obj;
                };
                res.json({
                    totalRoomsSold: totalRooms,
                    totalRevenue: +totalRevenue.toFixed(2),
                    avgAdr: totalRooms > 0 ? +(totalRevenue / totalRooms).toFixed(2) : 0,
                    avgOccupancy: totalWorking > 0 ? +((totalRooms / totalWorking) * 100).toFixed(2) : 0,
                    sourceMix: round(sourceMix),
                    byOta: round(byOta),
                    byPujari: round(byPujari),
                    byRoomType: round(byRoomType),
                    byRoom: round(byRoom),
                    trend: trend,
                });
                return [2 /*return*/];
        }
    });
}); }));
exports.default = router;
