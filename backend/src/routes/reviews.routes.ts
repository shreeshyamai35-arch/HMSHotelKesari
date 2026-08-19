import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { asyncHandler } from '../lib/asyncHandler';
import { authenticate, authorize } from '../middleware/auth';
import { ROLES } from '../constants/roles';
import { parseDate } from '../lib/dates';
import { notFound } from '../lib/errors';

const router = Router();
router.use(authenticate);

const canEdit = authorize(ROLES.ADMIN, ROLES.REVENUE, ROLES.MANAGEMENT);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { source } = req.query as Record<string, string | undefined>;
    const reviews = await prisma.review.findMany({
      where: source ? { source } : {},
      orderBy: { reviewedAt: 'desc' },
      take: 300,
    });
    res.json(reviews);
  })
);

const createSchema = z.object({
  source: z.enum(['GOOGLE', 'OTA', 'OTHER']),
  rating: z.number().min(0).max(5),
  text: z.string().optional().nullable(),
  author: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  reviewedAt: z.string().optional(),
});

router.post(
  '/',
  canEdit,
  asyncHandler(async (req, res) => {
    const data = createSchema.parse(req.body);
    const review = await prisma.review.create({
      data: {
        source: data.source,
        rating: data.rating,
        text: data.text ?? null,
        author: data.author ?? null,
        category: data.category ?? null,
        reviewedAt: parseDate(data.reviewedAt),
      },
    });
    res.status(201).json(review);
  })
);

router.delete(
  '/:id',
  canEdit,
  asyncHandler(async (req, res) => {
    const existing = await prisma.review.findUnique({ where: { id: req.params.id } });
    if (!existing) throw notFound('Review not found');
    await prisma.review.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  })
);

// Rating & complaint analysis
router.get(
  '/analytics',
  asyncHandler(async (_req, res) => {
    const [reviews, openComplaints, closedComplaints] = await Promise.all([
      prisma.review.findMany({ select: { source: true, rating: true } }),
      prisma.complaint.count({ where: { status: 'OPEN' } }),
      prisma.complaint.count({ where: { status: 'CLOSED' } }),
    ]);

    const total = reviews.length;
    const avgRating = total ? reviews.reduce((s, r) => s + r.rating, 0) / total : 0;

    const bySource: Record<string, { count: number; avg: number }> = {};
    const distribution: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
    let negativeCount = 0;

    for (const r of reviews) {
      const src = r.source;
      if (!bySource[src]) bySource[src] = { count: 0, avg: 0 };
      bySource[src].count += 1;
      bySource[src].avg += r.rating;
      const bucket = String(Math.min(5, Math.max(1, Math.round(r.rating))));
      distribution[bucket] = (distribution[bucket] ?? 0) + 1;
      if (r.rating <= 2) negativeCount++;
    }
    Object.keys(bySource).forEach((k) => {
      bySource[k].avg = bySource[k].count ? +(bySource[k].avg / bySource[k].count).toFixed(2) : 0;
    });

    res.json({
      total,
      avgRating: +avgRating.toFixed(2),
      bySource,
      distribution,
      negativeCount,
      complaints: { open: openComplaints, closed: closedComplaints },
    });
  })
);

export default router;
