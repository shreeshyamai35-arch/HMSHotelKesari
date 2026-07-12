import { Router } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler } from '../lib/asyncHandler';
import { authenticate, authorize } from '../middleware/auth';
import { ROLES } from '../constants/roles';
import { generateInsights } from '../services/ai.service';
import { startOfDay, endOfDay } from '../lib/dates';

const router = Router();
router.use(authenticate, authorize(ROLES.ADMIN, ROLES.MANAGEMENT, ROLES.REVENUE));

router.get(
  '/insights',
  asyncHandler(async (_req, res) => {
    const now = new Date();
    const dayStart = startOfDay(now);
    const dayEnd = endOfDay(now);

    const [revenue, reviews, openComplaints, openMaintenance, reportsToday] = await Promise.all([
      prisma.revenueRecord.findMany(),
      prisma.review.findMany(),
      prisma.complaint.count({ where: { status: 'OPEN' } }),
      prisma.maintenanceIssue.count({ where: { status: 'OPEN' } }),
      prisma.dailyReport.count({ where: { reportDate: { gte: dayStart, lte: dayEnd } } }),
    ]);

    const totalRevenue = revenue.reduce((s, r) => s + r.revenue, 0);
    const totalRoomsSold = revenue.reduce((s, r) => s + r.roomsSold, 0);
    const totalRoomsAvailable = revenue.reduce((s, r) => s + r.roomsAvailable, 0);
    const avgAdr = totalRoomsSold > 0 ? totalRevenue / totalRoomsSold : 0;
    const avgRevpar = totalRoomsAvailable > 0 ? totalRevenue / totalRoomsAvailable : 0;
    const occupancy = totalRoomsAvailable > 0 ? (totalRoomsSold / totalRoomsAvailable) * 100 : 0;
    const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

    const insight = await generateInsights({
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
  })
);

export default router;
