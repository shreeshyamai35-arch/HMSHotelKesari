import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { asyncHandler } from '../lib/asyncHandler';
import { authenticate, authorize } from '../middleware/auth';
import { ROLES, OCCUPANCY_SLOT_META } from '../constants/roles';
import { parseDate, startOfDay, endOfDay, nowIST, istDateKey, isSlotWindowOpen, SlotTime } from '../lib/dates';
import { notFound, conflict, badRequest } from '../lib/errors';

const router = Router();
router.use(authenticate);

// Map slot enum to SlotTime for time window validation
const SLOT_TO_TIME: Record<string, SlotTime> = {
  SLOT_1000: '10am',
  SLOT_1600: '4pm',
  SLOT_2200: '10pm',
};

const slotMeta = (slot: string) => OCCUPANCY_SLOT_META.find((m) => m.key === slot);

const gensetSchema = z.object({
  type: z.enum(['MORNING', 'EVENING']),
  status: z.enum(['WORKING', 'NOT_WORKING']),
  fuelLevel: z.enum(['FULL', 'MEDIUM', 'LOW']),
  remarks: z.string().optional().nullable(),
  employeeName: z.string().optional(),
});

const waterSchema = z.object({
  slot: z.enum(['SLOT_0700', 'SLOT_1200', 'SLOT_1600', 'SLOT_2100']),
  status: z.enum(['FULL', 'MEDIUM', 'LOW']),
  remarks: z.string().optional().nullable(),
  employeeName: z.string().optional(),
});

const checklistSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  status: z.string().min(1),
  remarks: z.string().optional().nullable(),
});

const createSchema = z.object({
  reportDate: z.string().optional(),
  slot: z.enum(['SLOT_1000', 'SLOT_1600', 'SLOT_2200']),
  remarks: z.string().optional().nullable(),
  gensetChecks: z.array(gensetSchema).default([]),
  waterTankChecks: z.array(waterSchema).default([]),
  checklistItems: z.array(checklistSchema).default([]),
  complaints: z.array(z.object({ details: z.string().min(1), guestName: z.string().optional().nullable() })).default([]),
  maintenance: z
    .array(z.object({ details: z.string().min(1), priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional() }))
    .default([]),
  incidents: z
    .array(z.object({ type: z.enum(['LOST_FOUND', 'SPECIAL_INCIDENT']), details: z.string().min(1) }))
    .default([]),
});

const reportInclude = {
  gensetChecks: true,
  waterTankChecks: true,
  checklistItems: true,
  complaints: true,
  maintenance: true,
  incidents: true,
  pdfReports: true,
} as const;

// Create a daily operations report
router.post(
  '/',
  authorize(ROLES.ADMIN, ROLES.FRONT_OFFICE),
  asyncHandler(async (req, res) => {
    const data = createSchema.parse(req.body);
    const user = req.user!;
    const reportDate = startOfDay(parseDate(data.reportDate));
    const dateKey = istDateKey(reportDate);
    const meta = slotMeta(data.slot);
    const slotLabel = meta?.label ?? data.slot;

    // Each slot must be submitted inside its own IST window, so a single morning
    // tap can no longer mark the evening checks as done. Admins may backfill.
    if (req.user!.role !== ROLES.ADMIN) {
      if (dateKey !== istDateKey(nowIST())) {
        throw badRequest('Reports can only be submitted for today (IST).');
      }
      if (!isSlotWindowOpen(SLOT_TO_TIME[data.slot])) {
        throw badRequest(
          `The ${slotLabel} report can only be submitted between ${meta?.windowStart}:00 and ${meta?.windowEnd}:00 IST.`
        );
      }
    }

    const duplicate = await prisma.dailyReport.findUnique({
      where: { reportDate_slot: { reportDate, slot: data.slot } },
      select: { id: true },
    });
    if (duplicate) {
      throw conflict(`The ${slotLabel} report for ${dateKey} has already been submitted.`);
    }

    const dbUser = await prisma.user.findUnique({ where: { id: user.sub } });
    const department = dbUser?.department ?? null;
    const employeeName = dbUser?.name ?? user.name;

    const report = await prisma.dailyReport.create({
      data: {
        reportDate,
        slot: data.slot,
        employeeId: user.sub,
        employeeName,
        department,
        remarks: data.remarks ?? null,
        gensetChecks: {
          create: data.gensetChecks.map((g) => ({
            type: g.type,
            status: g.status,
            fuelLevel: g.fuelLevel,
            remarks: g.remarks ?? null,
            employeeName: g.employeeName ?? employeeName,
          })),
        },
        waterTankChecks: {
          create: data.waterTankChecks.map((w) => ({
            slot: w.slot,
            status: w.status,
            remarks: w.remarks ?? null,
            employeeName: w.employeeName ?? employeeName,
          })),
        },
        checklistItems: {
          create: data.checklistItems.map((c) => ({
            key: c.key,
            label: c.label,
            status: c.status,
            remarks: c.remarks ?? null,
          })),
        },
        complaints: {
          create: data.complaints.map((c) => ({ details: c.details, guestName: c.guestName ?? null })),
        },
        maintenance: {
          create: data.maintenance.map((m) => ({ details: m.details, priority: m.priority ?? 'MEDIUM' })),
        },
        incidents: {
          create: data.incidents.map((i) => ({ type: i.type, details: i.details })),
        },
      },
      include: reportInclude,
    });

    res.status(201).json(report);
  })
);

// List reports (filterable). Front office sees only their own.
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { from, to, employeeId } = req.query as Record<string, string | undefined>;
    const where: Record<string, unknown> = {};

    if (req.user!.role === ROLES.FRONT_OFFICE) {
      where.employeeId = req.user!.sub;
    } else if (employeeId) {
      where.employeeId = employeeId;
    }

    if (from || to) {
      where.reportDate = {
        ...(from ? { gte: startOfDay(parseDate(from)) } : {}),
        ...(to ? { lte: endOfDay(parseDate(to)) } : {}),
      };
    }

    const reports = await prisma.dailyReport.findMany({
      where,
      select: {
        id: true,
        reportDate: true,
        slot: true,
        employeeId: true,
        employeeName: true,
        department: true,
        submittedAt: true,
        remarks: true,
      },
      orderBy: { reportDate: 'desc' },
      take: 200,
    });
    res.json(reports);
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const report = await prisma.dailyReport.findUnique({
      where: { id: req.params.id },
      include: reportInclude,
    });
    if (!report) throw notFound('Report not found');
    if (req.user!.role === ROLES.FRONT_OFFICE && report.employeeId !== req.user!.sub) {
      throw notFound('Report not found');
    }
    res.json(report);
  })
);

export default router;
