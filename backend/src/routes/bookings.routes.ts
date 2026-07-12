import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { asyncHandler } from '../lib/asyncHandler';
import { authenticate, authorize } from '../middleware/auth';
import { ROLES } from '../constants/roles';
import { parseDate, startOfDay, endOfDay } from '../lib/dates';

const router = Router();
router.use(authenticate);

const canEdit = authorize(ROLES.ADMIN, ROLES.REVENUE);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { from, to, source } = req.query as Record<string, string | undefined>;
    const where: Record<string, unknown> = {};
    if (source) where.source = source;
    if (from || to) {
      where.bookingDate = {
        ...(from ? { gte: startOfDay(parseDate(from)) } : {}),
        ...(to ? { lte: endOfDay(parseDate(to)) } : {}),
      };
    }
    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { bookingDate: 'desc' },
      take: 400,
    });
    res.json(bookings);
  })
);

const createSchema = z.object({
  bookingDate: z.string(),
  source: z.enum(['DIRECT', 'OTA', 'WALK_IN', 'CORPORATE', 'PMS']),
  status: z.enum(['CONFIRMED', 'CANCELLED', 'CHECKED_IN', 'CHECKED_OUT']).optional(),
  roomsBooked: z.number().int().min(1).optional(),
  amount: z.number().min(0).optional(),
  guestName: z.string().optional().nullable(),
});

router.post(
  '/',
  canEdit,
  asyncHandler(async (req, res) => {
    const data = createSchema.parse(req.body);
    const booking = await prisma.booking.create({
      data: {
        bookingDate: startOfDay(parseDate(data.bookingDate)),
        source: data.source,
        status: data.status ?? 'CONFIRMED',
        roomsBooked: data.roomsBooked ?? 1,
        amount: data.amount ?? 0,
        guestName: data.guestName ?? null,
      },
    });
    res.status(201).json(booking);
  })
);

router.get(
  '/analytics',
  asyncHandler(async (req, res) => {
    const { from, to } = req.query as Record<string, string | undefined>;
    const where: Record<string, unknown> = {};
    if (from || to) {
      where.bookingDate = {
        ...(from ? { gte: startOfDay(parseDate(from)) } : {}),
        ...(to ? { lte: endOfDay(parseDate(to)) } : {}),
      };
    }
    const bookings = await prisma.booking.findMany({ where, orderBy: { bookingDate: 'asc' } });

    const bySource: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    const trendMap: Record<string, number> = {};

    for (const b of bookings) {
      bySource[b.source] = (bySource[b.source] ?? 0) + b.roomsBooked;
      byStatus[b.status] = (byStatus[b.status] ?? 0) + 1;
      const key = b.bookingDate.toISOString().slice(0, 10);
      trendMap[key] = (trendMap[key] ?? 0) + b.roomsBooked;
    }

    const totalRoomsBooked = bookings.reduce((s, b) => s + b.roomsBooked, 0);
    const cancelled = byStatus['CANCELLED'] ?? 0;

    res.json({
      totalBookings: bookings.length,
      totalRoomsBooked,
      cancellationRate: bookings.length ? +((cancelled / bookings.length) * 100).toFixed(2) : 0,
      bySource: Object.entries(bySource).map(([source, rooms]) => ({ source, rooms })),
      byStatus: Object.entries(byStatus).map(([status, count]) => ({ status, count })),
      trend: Object.entries(trendMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, rooms]) => ({ date, rooms })),
    });
  })
);

export default router;
