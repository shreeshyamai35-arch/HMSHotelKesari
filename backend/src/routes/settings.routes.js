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
var roles_2 = require("../constants/roles");
var errors_1 = require("../lib/errors");
var rooms_1 = require("../lib/rooms");
var router = (0, express_1.Router)();
router.use(auth_1.authenticate);
var adminOnly = (0, auth_1.authorize)(roles_1.ROLES.ADMIN);
function getNumberSetting(key) {
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
// ─── Config (readable by any authenticated user) ──────────
// Powers the Occupancy Manager form dropdowns.
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
// Full lists (incl. inactive) for the admin settings screen.
router.get('/', adminOnly, (0, asyncHandler_1.asyncHandler)(function (_req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, totalRooms, rooms, roomTypes, onlineSources, pujaris, tierLow, tierHigh;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, Promise.all([
                    (0, rooms_1.getTotalRooms)(),
                    (0, rooms_1.listRooms)(false),
                    prisma_1.default.roomType.findMany({ orderBy: { name: 'asc' } }),
                    prisma_1.default.onlineSource.findMany({ orderBy: { name: 'asc' } }),
                    prisma_1.default.pujari.findMany({ orderBy: { name: 'asc' } }),
                    getNumberSetting(roles_2.SETTING_REVENUE_TIER_LOW),
                    getNumberSetting(roles_2.SETTING_REVENUE_TIER_HIGH),
                ])];
            case 1:
                _a = __read.apply(void 0, [_b.sent(), 7]), totalRooms = _a[0], rooms = _a[1], roomTypes = _a[2], onlineSources = _a[3], pujaris = _a[4], tierLow = _a[5], tierHigh = _a[6];
                res.json({ totalRooms: totalRooms, rooms: rooms, roomTypes: roomTypes, onlineSources: onlineSources, pujaris: pujaris, revenueTiers: { low: tierLow, high: tierHigh } });
                return [2 /*return*/];
        }
    });
}); }));
// ─── Revenue Calendar tier thresholds (admin override) ────
var tiersSchema = zod_1.z.object({
    low: zod_1.z.number().min(0).nullable(),
    high: zod_1.z.number().min(0).nullable(),
});
router.put('/revenue-tiers', adminOnly, (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    function setOrClear(key, val) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(val === null)) return [3 /*break*/, 2];
                        return [4 /*yield*/, prisma_1.default.setting.deleteMany({ where: { key: key } })];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, prisma_1.default.setting.upsert({
                            where: { key: key },
                            create: { key: key, value: String(val) },
                            update: { value: String(val) },
                        })];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    }
    var _a, low, high;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = tiersSchema.parse(req.body), low = _a.low, high = _a.high;
                return [4 /*yield*/, setOrClear(roles_2.SETTING_REVENUE_TIER_LOW, low)];
            case 1:
                _b.sent();
                return [4 /*yield*/, setOrClear(roles_2.SETTING_REVENUE_TIER_HIGH, high)];
            case 2:
                _b.sent();
                res.json({ revenueTiers: { low: low, high: high } });
                return [2 /*return*/];
        }
    });
}); }));
// ─── Total rooms ──────────────────────────────────────────
var totalRoomsSchema = zod_1.z.object({ totalRooms: zod_1.z.number().int().min(0).max(100000) });
router.put('/total-rooms', adminOnly, (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var totalRooms, s;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                totalRooms = totalRoomsSchema.parse(req.body).totalRooms;
                return [4 /*yield*/, prisma_1.default.setting.upsert({
                        where: { key: roles_2.SETTING_TOTAL_ROOMS },
                        create: { key: roles_2.SETTING_TOTAL_ROOMS, value: String(totalRooms) },
                        update: { value: String(totalRooms) },
                    })];
            case 1:
                s = _a.sent();
                res.json({ totalRooms: parseInt(s.value, 10) });
                return [2 /*return*/];
        }
    });
}); }));
// ─── Rooms (physical room list) ───────────────────────────
var roomCreateSchema = zod_1.z.object({
    // One or many room numbers, comma-separated: "101" or "101, 102, 103".
    numbers: zod_1.z.string().min(1).max(2000),
    roomTypeId: zod_1.z.string().optional().nullable(),
});
router.post('/rooms', adminOnly, (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var data, numbers, type, existing, created;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                data = roomCreateSchema.parse(req.body);
                numbers = __spreadArray([], __read(new Set(data.numbers.split(',').map(function (n) { return n.trim(); }).filter(Boolean))), false);
                if (numbers.length === 0)
                    throw (0, errors_1.badRequest)('Enter at least one room number.');
                if (numbers.some(function (n) { return n.length > 20; }))
                    throw (0, errors_1.badRequest)('Room numbers must be 20 characters or fewer.');
                if (!data.roomTypeId) return [3 /*break*/, 2];
                return [4 /*yield*/, prisma_1.default.roomType.findUnique({ where: { id: data.roomTypeId } })];
            case 1:
                type = _a.sent();
                if (!type)
                    throw (0, errors_1.notFound)('Room type not found');
                _a.label = 2;
            case 2: return [4 /*yield*/, prisma_1.default.room.findMany({ where: { number: { in: numbers } } })];
            case 3:
                existing = _a.sent();
                if (existing.length > 0) {
                    throw (0, errors_1.conflict)("Room(s) already exist: ".concat(existing.map(function (r) { return r.number; }).join(', ')));
                }
                return [4 /*yield*/, prisma_1.default.$transaction(numbers.map(function (number) { var _a; return prisma_1.default.room.create({ data: { number: number, roomTypeId: (_a = data.roomTypeId) !== null && _a !== void 0 ? _a : null } }); }))];
            case 4:
                created = _a.sent();
                res.status(201).json(created);
                return [2 /*return*/];
        }
    });
}); }));
var roomPatchSchema = zod_1.z.object({
    number: zod_1.z.string().min(1).max(20).optional(),
    roomTypeId: zod_1.z.string().optional().nullable(),
    active: zod_1.z.boolean().optional(),
});
router.patch('/rooms/:id', adminOnly, (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var data, existing, newNumber, clash, type, room;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                data = roomPatchSchema.parse(req.body);
                return [4 /*yield*/, prisma_1.default.room.findUnique({ where: { id: req.params.id } })];
            case 1:
                existing = _c.sent();
                if (!existing)
                    throw (0, errors_1.notFound)('Room not found');
                newNumber = ((_a = data.number) === null || _a === void 0 ? void 0 : _a.trim()) || undefined;
                if (!(newNumber && newNumber !== existing.number)) return [3 /*break*/, 3];
                return [4 /*yield*/, prisma_1.default.room.findUnique({ where: { number: newNumber } })];
            case 2:
                clash = _c.sent();
                if (clash)
                    throw (0, errors_1.conflict)('A room with this number already exists');
                _c.label = 3;
            case 3:
                if (!data.roomTypeId) return [3 /*break*/, 5];
                return [4 /*yield*/, prisma_1.default.roomType.findUnique({ where: { id: data.roomTypeId } })];
            case 4:
                type = _c.sent();
                if (!type)
                    throw (0, errors_1.notFound)('Room type not found');
                _c.label = 5;
            case 5: return [4 /*yield*/, prisma_1.default.room.update({
                    where: { id: req.params.id },
                    data: {
                        number: newNumber,
                        roomTypeId: data.roomTypeId === undefined ? undefined : (_b = data.roomTypeId) !== null && _b !== void 0 ? _b : null,
                        active: data.active,
                    },
                })];
            case 6:
                room = _c.sent();
                res.json(room);
                return [2 /*return*/];
        }
    });
}); }));
router.delete('/rooms/:id', adminOnly, (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var existing;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma_1.default.room.findUnique({ where: { id: req.params.id } })];
            case 1:
                existing = _a.sent();
                if (!existing)
                    throw (0, errors_1.notFound)('Room not found');
                // Past RoomSales keep their number/type snapshots (roomId becomes null).
                return [4 /*yield*/, prisma_1.default.room.delete({ where: { id: req.params.id } })];
            case 2:
                // Past RoomSales keep their number/type snapshots (roomId becomes null).
                _a.sent();
                res.json({ success: true });
                return [2 /*return*/];
        }
    });
}); }));
// ─── Generic CRUD for the simple name-lists ───────────────
var nameSchema = zod_1.z.object({ name: zod_1.z.string().min(1).max(120), active: zod_1.z.boolean().optional() });
// Room Types
router.post('/room-types', adminOnly, (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var data, exists, item;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                data = nameSchema.parse(req.body);
                return [4 /*yield*/, prisma_1.default.roomType.findUnique({ where: { name: data.name } })];
            case 1:
                exists = _a.sent();
                if (exists)
                    throw (0, errors_1.conflict)('A room type with this name already exists');
                return [4 /*yield*/, prisma_1.default.roomType.create({ data: { name: data.name } })];
            case 2:
                item = _a.sent();
                res.status(201).json(item);
                return [2 /*return*/];
        }
    });
}); }));
router.patch('/room-types/:id', adminOnly, (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var data, existing, item;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                data = nameSchema.partial().parse(req.body);
                return [4 /*yield*/, prisma_1.default.roomType.findUnique({ where: { id: req.params.id } })];
            case 1:
                existing = _a.sent();
                if (!existing)
                    throw (0, errors_1.notFound)('Room type not found');
                return [4 /*yield*/, prisma_1.default.roomType.update({ where: { id: req.params.id }, data: data })];
            case 2:
                item = _a.sent();
                res.json(item);
                return [2 /*return*/];
        }
    });
}); }));
router.delete('/room-types/:id', adminOnly, (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var existing;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma_1.default.roomType.findUnique({ where: { id: req.params.id } })];
            case 1:
                existing = _a.sent();
                if (!existing)
                    throw (0, errors_1.notFound)('Room type not found');
                return [4 /*yield*/, prisma_1.default.roomType.delete({ where: { id: req.params.id } })];
            case 2:
                _a.sent();
                res.json({ success: true });
                return [2 /*return*/];
        }
    });
}); }));
// Online Sources (OTAs)
router.post('/online-sources', adminOnly, (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var data, exists, item;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                data = nameSchema.parse(req.body);
                return [4 /*yield*/, prisma_1.default.onlineSource.findUnique({ where: { name: data.name } })];
            case 1:
                exists = _a.sent();
                if (exists)
                    throw (0, errors_1.conflict)('An online source with this name already exists');
                return [4 /*yield*/, prisma_1.default.onlineSource.create({ data: { name: data.name } })];
            case 2:
                item = _a.sent();
                res.status(201).json(item);
                return [2 /*return*/];
        }
    });
}); }));
router.patch('/online-sources/:id', adminOnly, (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var data, existing, item;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                data = nameSchema.partial().parse(req.body);
                return [4 /*yield*/, prisma_1.default.onlineSource.findUnique({ where: { id: req.params.id } })];
            case 1:
                existing = _a.sent();
                if (!existing)
                    throw (0, errors_1.notFound)('Online source not found');
                return [4 /*yield*/, prisma_1.default.onlineSource.update({ where: { id: req.params.id }, data: data })];
            case 2:
                item = _a.sent();
                res.json(item);
                return [2 /*return*/];
        }
    });
}); }));
router.delete('/online-sources/:id', adminOnly, (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var existing;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma_1.default.onlineSource.findUnique({ where: { id: req.params.id } })];
            case 1:
                existing = _a.sent();
                if (!existing)
                    throw (0, errors_1.notFound)('Online source not found');
                return [4 /*yield*/, prisma_1.default.onlineSource.delete({ where: { id: req.params.id } })];
            case 2:
                _a.sent();
                res.json({ success: true });
                return [2 /*return*/];
        }
    });
}); }));
// Pujaris (with commission %)
var pujariSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(120),
    phone: zod_1.z.string().max(30).optional().nullable(),
    commissionPct: zod_1.z.number().min(0).max(100).optional(),
    active: zod_1.z.boolean().optional(),
});
router.post('/pujaris', adminOnly, (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var data, exists, item;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                data = pujariSchema.parse(req.body);
                return [4 /*yield*/, prisma_1.default.pujari.findUnique({ where: { name: data.name } })];
            case 1:
                exists = _c.sent();
                if (exists)
                    throw (0, errors_1.conflict)('A Pujari with this name already exists');
                return [4 /*yield*/, prisma_1.default.pujari.create({
                        data: {
                            name: data.name,
                            phone: (_a = data.phone) !== null && _a !== void 0 ? _a : null,
                            commissionPct: (_b = data.commissionPct) !== null && _b !== void 0 ? _b : 0,
                        },
                    })];
            case 2:
                item = _c.sent();
                res.status(201).json(item);
                return [2 /*return*/];
        }
    });
}); }));
router.patch('/pujaris/:id', adminOnly, (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var data, existing, item;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                data = pujariSchema.partial().parse(req.body);
                return [4 /*yield*/, prisma_1.default.pujari.findUnique({ where: { id: req.params.id } })];
            case 1:
                existing = _b.sent();
                if (!existing)
                    throw (0, errors_1.notFound)('Pujari not found');
                return [4 /*yield*/, prisma_1.default.pujari.update({
                        where: { id: req.params.id },
                        data: __assign(__assign({}, data), { phone: data.phone === undefined ? undefined : (_a = data.phone) !== null && _a !== void 0 ? _a : null }),
                    })];
            case 2:
                item = _b.sent();
                res.json(item);
                return [2 /*return*/];
        }
    });
}); }));
router.delete('/pujaris/:id', adminOnly, (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var existing;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma_1.default.pujari.findUnique({ where: { id: req.params.id } })];
            case 1:
                existing = _a.sent();
                if (!existing)
                    throw (0, errors_1.notFound)('Pujari not found');
                return [4 /*yield*/, prisma_1.default.pujari.delete({ where: { id: req.params.id } })];
            case 2:
                _a.sent();
                res.json({ success: true });
                return [2 /*return*/];
        }
    });
}); }));
exports.default = router;
