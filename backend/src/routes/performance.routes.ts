import { Router } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler } from '../lib/asyncHandler';
import { authenticate, authorize } from '../middleware/auth';
import { ROLES } from '../constants/roles';
import { parseDate, startOfDay, endOfDay, addDays } from '../lib/dates';

const router = Router();
router.use(authenticate, authorize(ROLES.ADMIN, ROLES.MANAGEMENT, ROLES.REVENUE));

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { from, to } = req.query as Record<string, string | undefined>;
    const fromDate = from ? startOfDay(parseDate(from)) : startOfDay(addDays(new Date(), -30));
    const toDate = to ? endOfDay(parseDate(to)) : endOfDay(new Date());

    const reports = await prisma.dailyReport.findMany({
      where: { reportDate: { gte: fromDate, lte: toDate } },
      include: {
        gensetChecks: true,
        waterTankChecks: true,
        checklistItems: true,
      },
    });

    const byEmployee: Record<
      string,
      {
        employeeId: string;
        employeeName: string;
        department: string | null;
        reports: number;
        gensetChecks: number;
        waterChecks: number;
        checklistItems: number;
        tasks: number;
      }
    > = {};

    for (const r of reports) {
      if (!byEmployee[r.employeeId]) {
        byEmployee[r.employeeId] = {
          employeeId: r.employeeId,
          employeeName: r.employeeName,
          department: r.department,
          reports: 0,
          gensetChecks: 0,
          waterChecks: 0,
          checklistItems: 0,
          tasks: 0,
        };
      }
      const e = byEmployee[r.employeeId];
      e.reports += 1;
      e.gensetChecks += r.gensetChecks.length;
      e.waterChecks += r.waterTankChecks.length;
      e.checklistItems += r.checklistItems.length;
      e.tasks += r.gensetChecks.length + r.waterTankChecks.length + r.checklistItems.length;
    }

    const byDepartment: Record<string, { department: string; reports: number; tasks: number }> = {};
    for (const e of Object.values(byEmployee)) {
      const dept = e.department ?? 'Unassigned';
      if (!byDepartment[dept]) byDepartment[dept] = { department: dept, reports: 0, tasks: 0 };
      byDepartment[dept].reports += e.reports;
      byDepartment[dept].tasks += e.tasks;
    }

    res.json({
      from: fromDate,
      to: toDate,
      employees: Object.values(byEmployee).sort((a, b) => b.tasks - a.tasks),
      departments: Object.values(byDepartment).sort((a, b) => b.tasks - a.tasks),
      totals: {
        reports: reports.length,
        tasks: Object.values(byEmployee).reduce((s, e) => s + e.tasks, 0),
      },
    });
  })
);

export default router;
