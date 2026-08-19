"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../lib/prisma"));
const asyncHandler_1 = require("../lib/asyncHandler");
const auth_1 = require("../middleware/auth");
const roles_1 = require("../constants/roles");
const ai_service_1 = require("../services/ai.service");
const dates_1 = require("../lib/dates");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate, (0, auth_1.authorize)(roles_1.ROLES.ADMIN, roles_1.ROLES.MANAGEMENT, roles_1.ROLES.REVENUE));
router.get('/insights', (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const now = new Date();
    const dayStart = (0, dates_1.startOfDay)(now);
    const dayEnd = (0, dates_1.endOfDay)(now);
    const [revenue, reviews, openComplaints, openMaintenance, reportsToday] = await Promise.all([
        prisma_1.default.revenueRecord.findMany(),
        prisma_1.default.review.findMany(),
        prisma_1.default.complaint.count({ where: { status: 'OPEN' } }),
        prisma_1.default.maintenanceIssue.count({ where: { status: 'OPEN' } }),
        prisma_1.default.dailyReport.count({ where: { reportDate: { gte: dayStart, lte: dayEnd } } }),
    ]);
    const totalRevenue = revenue.reduce((s, r) => s + r.revenue, 0);
    const totalRoomsSold = revenue.reduce((s, r) => s + r.roomsSold, 0);
    const totalRoomsAvailable = revenue.reduce((s, r) => s + r.roomsAvailable, 0);
    const avgAdr = totalRoomsSold > 0 ? totalRevenue / totalRoomsSold : 0;
    const avgRevpar = totalRoomsAvailable > 0 ? totalRevenue / totalRoomsAvailable : 0;
    const occupancy = totalRoomsAvailable > 0 ? (totalRoomsSold / totalRoomsAvailable) * 100 : 0;
    const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
    const insight = await (0, ai_service_1.generateInsights)({
        occupancy,
        totalRevenue,
        avgAdr,
        avgRevpar,
        openComplaints,
        openMaintenance,
        avgRating,
        reportsToday,
    });
    res.json(insight);
}));
exports.default = router;
