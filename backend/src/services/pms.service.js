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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncPms = syncPms;
var env_1 = require("../config/env");
var prisma_1 = __importDefault(require("../lib/prisma"));
var dates_1 = require("../lib/dates");
/**
 * Mock adapter: generates plausible booking/revenue data so the analytics
 * modules work end-to-end without live credentials. Deterministic per date.
 */
var mockAdapter = {
    name: 'mock',
    fetchRange: function (from, to) {
        return __awaiter(this, void 0, void 0, function () {
            var out, roomsAvailable, cursor, end, seed, roomsSold, adr, revenue;
            return __generator(this, function (_a) {
                out = [];
                roomsAvailable = 40;
                cursor = (0, dates_1.startOfDay)(from);
                end = (0, dates_1.startOfDay)(to);
                while (cursor <= end) {
                    seed = cursor.getDate() + cursor.getMonth() * 31;
                    roomsSold = 18 + (seed % 20);
                    adr = 2800 + (seed % 12) * 80;
                    revenue = roomsSold * adr;
                    out.push({
                        date: new Date(cursor),
                        revenue: revenue,
                        roomsSold: roomsSold,
                        roomsAvailable: roomsAvailable,
                        bookings: [
                            { source: 'OTA', status: 'CONFIRMED', roomsBooked: Math.round(roomsSold * 0.5), amount: revenue * 0.5 },
                            { source: 'DIRECT', status: 'CONFIRMED', roomsBooked: Math.round(roomsSold * 0.3), amount: revenue * 0.3 },
                            { source: 'WALK_IN', status: 'CHECKED_IN', roomsBooked: Math.round(roomsSold * 0.2), amount: revenue * 0.2 },
                        ],
                    });
                    cursor = (0, dates_1.addDays)(cursor, 1);
                }
                return [2 /*return*/, out];
            });
        });
    },
};
/**
 * eZee Absolute adapter scaffold. Wire real API/MCP calls here when
 * credentials are provided. Falls back to mock on any failure.
 */
var ezeeAdapter = {
    name: 'ezee',
    fetchRange: function (from, to) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (!env_1.env.pms.apiUrl || !env_1.env.pms.authCode) {
                    return [2 /*return*/, mockAdapter.fetchRange(from, to)];
                }
                try {
                    // Placeholder for the real eZee Absolute API/MCP integration.
                    // const resp = await fetch(env.pms.apiUrl, { ... });
                    // transform resp -> PmsDailyData[]
                    return [2 /*return*/, mockAdapter.fetchRange(from, to)];
                }
                catch (err) {
                    console.error('[pms:ezee:fallback]', err);
                    return [2 /*return*/, mockAdapter.fetchRange(from, to)];
                }
                return [2 /*return*/];
            });
        });
    },
};
function getAdapter() {
    return env_1.env.pms.provider === 'ezee' ? ezeeAdapter : mockAdapter;
}
function computeMetrics(revenue, roomsSold, roomsAvailable) {
    var adr = roomsSold > 0 ? revenue / roomsSold : 0;
    var revpar = roomsAvailable > 0 ? revenue / roomsAvailable : 0;
    return { adr: +adr.toFixed(2), revpar: +revpar.toFixed(2) };
}
/** Syncs PMS data into PostgreSQL (RevenueRecord + Booking). Returns counts. */
function syncPms(from, to) {
    return __awaiter(this, void 0, void 0, function () {
        var adapter, data, bookingCount, data_1, data_1_1, day, recordDate, _a, adr, revpar, _b, _c, b, e_1_1, e_2_1;
        var e_2, _d, e_1, _e;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    adapter = getAdapter();
                    // Block mock adapter in production to prevent accidental corruption of real data
                    if (env_1.env.isProd && adapter.name === 'mock') {
                        throw new Error('Mock PMS sync is disabled in production. Set PMS_PROVIDER to a real adapter or switch NODE_ENV to development.');
                    }
                    return [4 /*yield*/, adapter.fetchRange(from, to)];
                case 1:
                    data = _f.sent();
                    bookingCount = 0;
                    _f.label = 2;
                case 2:
                    _f.trys.push([2, 15, 16, 17]);
                    data_1 = __values(data), data_1_1 = data_1.next();
                    _f.label = 3;
                case 3:
                    if (!!data_1_1.done) return [3 /*break*/, 14];
                    day = data_1_1.value;
                    recordDate = (0, dates_1.startOfDay)(day.date);
                    _a = computeMetrics(day.revenue, day.roomsSold, day.roomsAvailable), adr = _a.adr, revpar = _a.revpar;
                    // Check if a manual-entry record exists — PMS can override it (higher priority)
                    return [4 /*yield*/, prisma_1.default.revenueRecord.upsert({
                            where: { recordDate: recordDate },
                            create: {
                                recordDate: recordDate,
                                revenue: day.revenue,
                                roomsSold: day.roomsSold,
                                roomsAvailable: day.roomsAvailable,
                                adr: adr,
                                revpar: revpar,
                                source: 'PMS',
                            },
                            update: {
                                revenue: day.revenue,
                                roomsSold: day.roomsSold,
                                roomsAvailable: day.roomsAvailable,
                                adr: adr,
                                revpar: revpar,
                                source: 'PMS',
                            },
                        })];
                case 4:
                    // Check if a manual-entry record exists — PMS can override it (higher priority)
                    _f.sent();
                    // Replace PMS-sourced bookings for that day to stay idempotent.
                    return [4 /*yield*/, prisma_1.default.booking.deleteMany({ where: { bookingDate: recordDate, source: 'PMS' } })];
                case 5:
                    // Replace PMS-sourced bookings for that day to stay idempotent.
                    _f.sent();
                    _f.label = 6;
                case 6:
                    _f.trys.push([6, 11, 12, 13]);
                    _b = (e_1 = void 0, __values(day.bookings)), _c = _b.next();
                    _f.label = 7;
                case 7:
                    if (!!_c.done) return [3 /*break*/, 10];
                    b = _c.value;
                    return [4 /*yield*/, prisma_1.default.booking.create({
                            data: {
                                bookingDate: recordDate,
                                source: 'PMS',
                                status: b.status,
                                roomsBooked: b.roomsBooked,
                                amount: b.amount,
                            },
                        })];
                case 8:
                    _f.sent();
                    bookingCount += 1;
                    _f.label = 9;
                case 9:
                    _c = _b.next();
                    return [3 /*break*/, 7];
                case 10: return [3 /*break*/, 13];
                case 11:
                    e_1_1 = _f.sent();
                    e_1 = { error: e_1_1 };
                    return [3 /*break*/, 13];
                case 12:
                    try {
                        if (_c && !_c.done && (_e = _b.return)) _e.call(_b);
                    }
                    finally { if (e_1) throw e_1.error; }
                    return [7 /*endfinally*/];
                case 13:
                    data_1_1 = data_1.next();
                    return [3 /*break*/, 3];
                case 14: return [3 /*break*/, 17];
                case 15:
                    e_2_1 = _f.sent();
                    e_2 = { error: e_2_1 };
                    return [3 /*break*/, 17];
                case 16:
                    try {
                        if (data_1_1 && !data_1_1.done && (_d = data_1.return)) _d.call(data_1);
                    }
                    finally { if (e_2) throw e_2.error; }
                    return [7 /*endfinally*/];
                case 17: return [2 /*return*/, { provider: adapter.name, days: data.length, bookings: bookingCount }];
            }
        });
    });
}
