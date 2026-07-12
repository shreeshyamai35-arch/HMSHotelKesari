import { Router } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler } from '../lib/asyncHandler';
import { authenticate } from '../middleware/auth';
import { startOfDay, endOfDay } from '../lib/dates';
import { WATER_TANK_SLOTS } from '../constants/roles';

const WATER_TANK_SLOTS_COUNT = WATER_TANK_SLOTS.length;

const router = Router();
router.use(authenticate);

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const now = new Date();
    const dayStart = startOfDay(now);
    const dayEnd = endOfDay(now);

    const todaysReports = await prisma.dailyReport.findMany({
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

    const gensetTypesDone = new Set<string>();
    const waterSlotsDone = new Set<string>();
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
      prisma.complaint.count({ where: { status: 'OPEN' } }),
      prisma.maintenanceIssue.count({ where: { status: 'OPEN' } }),
      prisma.dailyReport.count({ where: { reportDate: { gte: dayStart, lte: dayEnd } } }),
      prisma.dailyReport.findMany({
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
  })
);

export default router;
