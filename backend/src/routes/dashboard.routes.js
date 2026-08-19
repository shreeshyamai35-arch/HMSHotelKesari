"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../lib/prisma"));
const asyncHandler_1 = require("../lib/asyncHandler");
const auth_1 = require("../middleware/auth");
const dates_1 = require("../lib/dates");
const roles_1 = require("../constants/roles");
const WATER_TANK_SLOTS_COUNT = roles_1.WATER_TANK_SLOTS.length;
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/', (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const now = new Date();
    const dayStart = (0, dates_1.startOfDay)(now);
    const dayEnd = (0, dates_1.endOfDay)(now);
    const todaysReports = await prisma_1.default.dailyReport.findMany({
        where: { reportDate: { gte: dayStart, lte: dayEnd } },
        include: {
            gensetChecks: true,
            waterTankChecks: true,
            checklistItems: true,
        },
    });
    // Scheduled tasks expected per day: 2 genset + 4 water tank = 6
    const EXPECTED_GENSET = 2;
    const EXPECTED_WATER = WATER_TANK_SLOTS_COUNT; // 4
    const gensetTypesDone = new Set();
    const waterSlotsDone = new Set();
    let checklistDone = 0;
    for (const r of todaysReports) {
        r.gensetChecks.forEach((g) => gensetTypesDone.add(g.type));
        r.waterTankChecks.forEach((w) => waterSlotsDone.add(w.slot));
        checklistDone += r.checklistItems.length;
    }
    const completedScheduled = gensetTypesDone.size + waterSlotsDone.size;
    const totalScheduled = EXPECTED_GENSET + EXPECTED_WATER;
    const pendingScheduled = Math.max(0, totalScheduled - completedScheduled);
    const [openComplaints, openMaintenance, totalReportsToday, recentReports] = await Promise.all([
        prisma_1.default.complaint.count({ where: { status: 'OPEN' } }),
        prisma_1.default.maintenanceIssue.count({ where: { status: 'OPEN' } }),
        prisma_1.default.dailyReport.count({ where: { reportDate: { gte: dayStart, lte: dayEnd } } }),
        prisma_1.default.dailyReport.findMany({
            orderBy: { submittedAt: 'desc' },
            take: 8,
            select: {
                id: true,
                reportDate: true,
                employeeName: true,
                department: true,
                submittedAt: true,
            },
        }),
    ]);
    res.json({
        date: dayStart,
        checklist: {
            completed: completedScheduled,
            pending: pendingScheduled,
            total: totalScheduled,
            gensetDone: Array.from(gensetTypesDone),
            waterDone: Array.from(waterSlotsDone),
            checklistItemsDone: checklistDone,
        },
        reportsSubmittedToday: totalReportsToday,
        openComplaints,
        openMaintenance,
        recentReports,
    });
}));
exports.default = router;
