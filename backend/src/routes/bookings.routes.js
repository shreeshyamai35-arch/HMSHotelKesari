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
var router = (0, express_1.Router)();
router.use(auth_1.authenticate);
var canEdit = (0, auth_1.authorize)(roles_1.ROLES.ADMIN, roles_1.ROLES.REVENUE);
router.get('/', (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, from, to, source, where, bookings;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = req.query, from = _a.from, to = _a.to, source = _a.source;
                where = {};
                if (source)
                    where.source = source;
                if (from || to) {
                    where.bookingDate = __assign(__assign({}, (from ? { gte: (0, dates_1.startOfDay)((0, dates_1.parseDate)(from)) } : {})), (to ? { lte: (0, dates_1.endOfDay)((0, dates_1.parseDate)(to)) } : {}));
                }
                return [4 /*yield*/, prisma_1.default.booking.findMany({
                        where: where,
                        orderBy: { bookingDate: 'desc' },
                        take: 400,
                    })];
            case 1:
                bookings = _b.sent();
                res.json(bookings);
                return [2 /*return*/];
        }
    });
}); }));
var createSchema = zod_1.z.object({
    bookingDate: zod_1.z.string(),
    arrivalDate: zod_1.z.string().optional().nullable(),
    nights: zod_1.z.number().int().min(1).optional(),
    source: zod_1.z.enum(['DIRECT', 'OTA', 'WALK_IN', 'CORPORATE', 'PMS']),
    status: zod_1.z.enum(['CONFIRMED', 'CANCELLED', 'CHECKED_IN', 'CHECKED_OUT']).optional(),
    roomsBooked: zod_1.z.number().int().min(1).optional(),
    amount: zod_1.z.number().min(0).optional(),
    guestName: zod_1.z.string().optional().nullable(),
});
router.post('/', canEdit, (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var data, booking;
    var _a, _b, _c, _d, _e;
    return __generator(this, function (_f) {
        switch (_f.label) {
            case 0:
                data = createSchema.parse(req.body);
                return [4 /*yield*/, prisma_1.default.booking.create({
                        data: {
                            bookingDate: (0, dates_1.startOfDay)((0, dates_1.parseDate)(data.bookingDate)),
                            arrivalDate: data.arrivalDate ? (0, dates_1.startOfDay)((0, dates_1.parseDate)(data.arrivalDate)) : null,
                            nights: (_a = data.nights) !== null && _a !== void 0 ? _a : 1,
                            source: data.source,
                            status: (_b = data.status) !== null && _b !== void 0 ? _b : 'CONFIRMED',
                            roomsBooked: (_c = data.roomsBooked) !== null && _c !== void 0 ? _c : 1,
                            amount: (_d = data.amount) !== null && _d !== void 0 ? _d : 0,
                            guestName: (_e = data.guestName) !== null && _e !== void 0 ? _e : null,
                        },
                    })];
            case 1:
                booking = _f.sent();
                res.status(201).json(booking);
                return [2 /*return*/];
        }
    });
}); }));
router.get('/analytics', (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, from, to, where, bookings, bySource, byStatus, trendMap, bookings_1, bookings_1_1, b, key, totalRoomsBooked, cancelled;
    var e_1, _b;
    var _c, _d, _e, _f;
    return __generator(this, function (_g) {
        switch (_g.label) {
            case 0:
                _a = req.query, from = _a.from, to = _a.to;
                where = {};
                if (from || to) {
                    where.bookingDate = __assign(__assign({}, (from ? { gte: (0, dates_1.startOfDay)((0, dates_1.parseDate)(from)) } : {})), (to ? { lte: (0, dates_1.endOfDay)((0, dates_1.parseDate)(to)) } : {}));
                }
                return [4 /*yield*/, prisma_1.default.booking.findMany({ where: where, orderBy: { bookingDate: 'asc' } })];
            case 1:
                bookings = _g.sent();
                bySource = {};
                byStatus = {};
                trendMap = {};
                try {
                    for (bookings_1 = __values(bookings), bookings_1_1 = bookings_1.next(); !bookings_1_1.done; bookings_1_1 = bookings_1.next()) {
                        b = bookings_1_1.value;
                        bySource[b.source] = ((_c = bySource[b.source]) !== null && _c !== void 0 ? _c : 0) + b.roomsBooked;
                        byStatus[b.status] = ((_d = byStatus[b.status]) !== null && _d !== void 0 ? _d : 0) + 1;
                        key = b.bookingDate.toISOString().slice(0, 10);
                        trendMap[key] = ((_e = trendMap[key]) !== null && _e !== void 0 ? _e : 0) + b.roomsBooked;
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (bookings_1_1 && !bookings_1_1.done && (_b = bookings_1.return)) _b.call(bookings_1);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
                totalRoomsBooked = bookings.reduce(function (s, b) { return s + b.roomsBooked; }, 0);
                cancelled = (_f = byStatus['CANCELLED']) !== null && _f !== void 0 ? _f : 0;
                res.json({
                    totalBookings: bookings.length,
                    totalRoomsBooked: totalRoomsBooked,
                    cancellationRate: bookings.length ? +((cancelled / bookings.length) * 100).toFixed(2) : 0,
                    bySource: Object.entries(bySource).map(function (_a) {
                        var _b = __read(_a, 2), source = _b[0], rooms = _b[1];
                        return ({ source: source, rooms: rooms });
                    }),
                    byStatus: Object.entries(byStatus).map(function (_a) {
                        var _b = __read(_a, 2), status = _b[0], count = _b[1];
                        return ({ status: status, count: count });
                    }),
                    trend: Object.entries(trendMap)
                        .sort(function (_a, _b) {
                        var _c = __read(_a, 1), a = _c[0];
                        var _d = __read(_b, 1), b = _d[0];
                        return a.localeCompare(b);
                    })
                        .map(function (_a) {
                        var _b = __read(_a, 2), date = _b[0], rooms = _b[1];
                        return ({ date: date, rooms: rooms });
                    }),
                });
                return [2 /*return*/];
        }
    });
}); }));
exports.default = router;
