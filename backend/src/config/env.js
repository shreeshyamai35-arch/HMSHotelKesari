"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v;
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
var dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
function required(key, fallback) {
    var _a;
    var value = (_a = process.env[key]) !== null && _a !== void 0 ? _a : fallback;
    if (value === undefined) {
        throw new Error("Missing required environment variable: ".concat(key));
    }
    return value;
}
// Set timezone to IST before any date operations
process.env.TZ = (_a = process.env.TZ) !== null && _a !== void 0 ? _a : 'Asia/Kolkata';
var isProd = ((_b = process.env.NODE_ENV) !== null && _b !== void 0 ? _b : 'development') === 'production';
// Fail hard if JWT_SECRET is missing in production
if (!process.env.JWT_SECRET && isProd) {
    throw new Error('JWT_SECRET is required in production');
}
exports.env = {
    nodeEnv: (_c = process.env.NODE_ENV) !== null && _c !== void 0 ? _c : 'development',
    port: parseInt((_d = process.env.PORT) !== null && _d !== void 0 ? _d : '4000', 10),
    corsOrigin: (_e = process.env.CORS_ORIGIN) !== null && _e !== void 0 ? _e : 'http://localhost:5173',
    jwtSecret: required('JWT_SECRET', isProd ? undefined : 'dev-secret-change-me'),
    jwtExpiresIn: (_f = process.env.JWT_EXPIRES_IN) !== null && _f !== void 0 ? _f : '7d',
    databaseUrl: required('DATABASE_URL', 'file:./dev.db'),
    smtp: {
        host: (_g = process.env.SMTP_HOST) !== null && _g !== void 0 ? _g : '',
        port: parseInt((_h = process.env.SMTP_PORT) !== null && _h !== void 0 ? _h : '587', 10),
        user: (_j = process.env.SMTP_USER) !== null && _j !== void 0 ? _j : '',
        pass: (_k = process.env.SMTP_PASS) !== null && _k !== void 0 ? _k : '',
        from: (_l = process.env.SMTP_FROM) !== null && _l !== void 0 ? _l : 'Hotel Kesari <no-reply@hotelkesari.com>',
    },
    ai: {
        provider: (_m = process.env.AI_PROVIDER) !== null && _m !== void 0 ? _m : 'mock',
        apiKey: (_o = process.env.AI_API_KEY) !== null && _o !== void 0 ? _o : '',
        model: (_p = process.env.AI_MODEL) !== null && _p !== void 0 ? _p : 'gpt-4o-mini',
    },
    pms: {
        provider: (_q = process.env.PMS_PROVIDER) !== null && _q !== void 0 ? _q : 'mock',
        apiUrl: (_r = process.env.EZEE_API_URL) !== null && _r !== void 0 ? _r : '',
        hotelCode: (_s = process.env.EZEE_HOTEL_CODE) !== null && _s !== void 0 ? _s : '',
        authCode: (_t = process.env.EZEE_AUTH_CODE) !== null && _t !== void 0 ? _t : '',
    },
    checkGraceMinutes: parseInt((_u = process.env.CHECK_GRACE_MINUTES) !== null && _u !== void 0 ? _u : '60', 10),
    enableCron: ((_v = process.env.ENABLE_CRON) !== null && _v !== void 0 ? _v : 'true') === 'true',
    isProd: isProd,
    timezone: process.env.TZ,
};
