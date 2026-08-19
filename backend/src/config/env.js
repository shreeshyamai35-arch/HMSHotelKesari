"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
function required(key, fallback) {
    const value = process.env[key] ?? fallback;
    if (value === undefined) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
}
// Set timezone to IST before any date operations
process.env.TZ = process.env.TZ ?? 'Asia/Kolkata';
const isProd = (process.env.NODE_ENV ?? 'development') === 'production';
// Fail hard if JWT_SECRET is missing in production
if (!process.env.JWT_SECRET && isProd) {
    throw new Error('JWT_SECRET is required in production');
}
exports.env = {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: parseInt(process.env.PORT ?? '4000', 10),
    corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    jwtSecret: required('JWT_SECRET', isProd ? undefined : 'dev-secret-change-me'),
    jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
    databaseUrl: required('DATABASE_URL', 'file:./dev.db'),
    smtp: {
        host: process.env.SMTP_HOST ?? '',
        port: parseInt(process.env.SMTP_PORT ?? '587', 10),
        user: process.env.SMTP_USER ?? '',
        pass: process.env.SMTP_PASS ?? '',
        from: process.env.SMTP_FROM ?? 'Hotel Kesari <no-reply@hotelkesari.com>',
    },
    ai: {
        provider: process.env.AI_PROVIDER ?? 'mock',
        apiKey: process.env.AI_API_KEY ?? '',
        model: process.env.AI_MODEL ?? 'gpt-4o-mini',
    },
    pms: {
        provider: process.env.PMS_PROVIDER ?? 'mock',
        apiUrl: process.env.EZEE_API_URL ?? '',
        hotelCode: process.env.EZEE_HOTEL_CODE ?? '',
        authCode: process.env.EZEE_AUTH_CODE ?? '',
    },
    checkGraceMinutes: parseInt(process.env.CHECK_GRACE_MINUTES ?? '60', 10),
    enableCron: (process.env.ENABLE_CRON ?? 'true') === 'true',
    isProd,
    timezone: process.env.TZ,
};
