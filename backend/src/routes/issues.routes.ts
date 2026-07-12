import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { asyncHandler } from '../lib/asyncHandler';
import { authenticate } from '../middleware/auth';
import { notFound } from '../lib/errors';

const router = Router();
router.use(authenticate);

// ─── Complaints ───────────────────────────────────────────
router.get(
  '/complaints',
  asyncHandler(async (req, res) => {
    const { status } = req.query as Record<string, string | undefined>;
    const complaints = await prisma.complaint.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    res.json(complaints);
  })
);

const complaintCreateSchema = z.object({
  details: z.string().min(1),
  guestName: z.string().optional().nullable(),
});

router.post(
  '/complaints',
  asyncHandler(async (req, res) => {
    const data = complaintCreateSchema.parse(req.body);
    const complaint = await prisma.complaint.create({
      data: { details: data.details, guestName: data.guestName ?? null },
    });
    res.status(201).json(complaint);
  })
);

const statusSchema = z.object({ status: z.enum(['OPEN', 'CLOSED']) });

router.patch(
  '/complaints/:id',
  asyncHandler(async (req, res) => {
    const { status } = statusSchema.parse(req.body);
    const existing = await prisma.complaint.findUnique({ where: { id: req.params.id } });
    if (!existing) throw notFound('Complaint not found');
    const complaint = await prisma.complaint.update({
      where: { id: req.params.id },
      data: { status, resolvedAt: status === 'CLOSED' ? new Date() : null },
    });
    res.json(complaint);
  })
);

// ─── Maintenance ──────────────────────────────────────────
router.get(
  '/maintenance',
  asyncHandler(async (req, res) => {
    const { status } = req.query as Record<string, string | undefined>;
    const items = await prisma.maintenanceIssue.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    res.json(items);
  })
);

const maintenanceCreateSchema = z.object({
  details: z.string().min(1),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
});

router.post(
  '/maintenance',
  asyncHandler(async (req, res) => {
    const data = maintenanceCreateSchema.parse(req.body);
    const item = await prisma.maintenanceIssue.create({
      data: { details: data.details, priority: data.priority ?? 'MEDIUM' },
    });
    res.status(201).json(item);
  })
);

router.patch(
  '/maintenance/:id',
  asyncHandler(async (req, res) => {
    const { status } = statusSchema.parse(req.body);
    const existing = await prisma.maintenanceIssue.findUnique({ where: { id: req.params.id } });
    if (!existing) throw notFound('Maintenance issue not found');
    const item = await prisma.maintenanceIssue.update({
      where: { id: req.params.id },
      data: { status, resolvedAt: status === 'CLOSED' ? new Date() : null },
    });
    res.json(item);
  })
);

export default router;
