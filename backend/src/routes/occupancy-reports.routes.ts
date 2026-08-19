import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { asyncHandler } from '../lib/asyncHandler';
import { authenticate, authorize } from '../middleware/auth';
import { ROLES } from '../constants/roles';
import { parseDate, startOfDay, endOfDay, localDateKey, addDays } from '../lib/dates';
import { badRequest, notFound } from '../lib/errors';
import { generateOccupancyPDF } from '../lib/pdf-generator';

const router = Router();
router.use(authenticate);

// ADMIN, REVENUE, and MANAGEMENT can download reports
const canDownload = authorize(ROLES.ADMIN, ROLES.REVENUE, ROLES.MANAGEMENT);

// ─── Hourly Report (single slot snapshot) ────────────────────
const hourlySchema = z.object({
  date: z.string(),
  slot: z.enum(['SLOT_1000', 'SLOT_1600', 'SLOT_2200']),
});

router.get(
  '/hourly',
  canDownload,
  asyncHandler(async (req, res) => {
    const { date, slot } = hourlySchema.parse(req.query);
    const reportDate = startOfDay(parseDate(date));

    const slotData = await prisma.occupancySlot.findUnique({
      where: {
        reportDate_slot: { reportDate, slot },
      },
      include: {
        sales: {
          orderBy: { roomNumber: 'asc' },
        },
      },
    });

    if (!slotData) {
      throw notFound(`No data found for ${date} ${slot}`);
    }

    const slotLabels: Record<string, string> = {
      SLOT_1000: '10 AM',
      SLOT_1600: '4 PM',
      SLOT_2200: '10 PM',
    };

    const pdf = await generateOccupancyPDF({
      title: `Hourly Occupancy Report - ${slotLabels[slot]}`,
      subtitle: `Date: ${new Date(reportDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`,
      data: {
        totalRooms: slotData.totalRooms,
        workingRooms: slotData.workingRooms,
        outOfOrder: slotData.outOfOrder,
        roomsSold: slotData.roomsSold,
        revenue: slotData.totalRevenue,
        occupancy: slotData.workingRooms > 0 ? (slotData.roomsSold / slotData.workingRooms) * 100 : 0,
        notes: slotData.notes,
        submittedBy: slotData.submittedByName,
        submittedAt: slotData.submittedAt,
        sales: slotData.sales.map((s) => ({
          roomNumber: s.roomNumber,
          roomType: s.roomType,
          source: s.source,
          sourceDetail: s.sourceDetail,
          priceSold: s.priceSold,
        })),
      },
    });

    const filename = `Hourly_Report_${date}_${slotLabels[slot].replace(' ', '')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdf);
  })
);

// ─── Daily Report (all three slots for a date) ───────────────
const dailySchema = z.object({
  date: z.string(),
});

router.get(
  '/daily',
  canDownload,
  asyncHandler(async (req, res) => {
    const { date } = dailySchema.parse(req.query);
    const reportDate = startOfDay(parseDate(date));

    const slots = await prisma.occupancySlot.findMany({
      where: { reportDate },
      include: {
        sales: {
          orderBy: { roomNumber: 'asc' },
        },
      },
      orderBy: { slot: 'asc' },
    });

    if (slots.length === 0) {
      throw notFound(`No data found for ${date}`);
    }

    const slotLabels: Record<string, string> = {
      SLOT_1000: '10 AM',
      SLOT_1600: '4 PM',
      SLOT_2200: '10 PM',
    };

    const sections = slots.map((slot) => ({
      slotLabel: slotLabels[slot.slot],
      totalRooms: slot.totalRooms,
      workingRooms: slot.workingRooms,
      outOfOrder: slot.outOfOrder,
      roomsSold: slot.roomsSold,
      revenue: slot.totalRevenue,
      occupancy: slot.workingRooms > 0 ? (slot.roomsSold / slot.workingRooms) * 100 : 0,
      notes: slot.notes,
      submittedBy: slot.submittedByName,
      submittedAt: slot.submittedAt,
      sales: slot.sales.map((s) => ({
        roomNumber: s.roomNumber,
        roomType: s.roomType,
        source: s.source,
        sourceDetail: s.sourceDetail,
        priceSold: s.priceSold,
      })),
    }));

    const totalRevenue = slots.reduce((sum, s) => sum + s.totalRevenue, 0);
    const avgOccupancy = slots.length > 0
      ? slots.reduce((sum, s) => {
          const occ = s.workingRooms > 0 ? (s.roomsSold / s.workingRooms) * 100 : 0;
          return sum + occ;
        }, 0) / slots.length
      : 0;

    const pdf = await generateOccupancyPDF({
      title: 'Daily Occupancy Report',
      subtitle: `Date: ${new Date(reportDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`,
      data: {
        slots: sections,
        summary: {
          totalRevenue,
          avgOccupancy,
          slotsReported: slots.length,
        },
      },
    });

    const filename = `Daily_Report_${date}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdf);
  })
);

// ─── Weekly Report (7-day aggregation) ───────────────────────
const weeklySchema = z.object({
  startDate: z.string(),
});

router.get(
  '/weekly',
  canDownload,
  asyncHandler(async (req, res) => {
    const { startDate } = weeklySchema.parse(req.query);
    const start = startOfDay(parseDate(startDate));
    const end = endOfDay(addDays(start, 6));

    const slots = await prisma.occupancySlot.findMany({
      where: {
        reportDate: {
          gte: start,
          lte: end,
        },
      },
      include: {
        sales: true,
      },
      orderBy: [{ reportDate: 'asc' }, { slot: 'asc' }],
    });

    if (slots.length === 0) {
      throw notFound(`No data found for week starting ${startDate}`);
    }

    // Group by date
    const byDate = new Map<string, typeof slots>();
    for (const slot of slots) {
      const key = localDateKey(slot.reportDate);
      if (!byDate.has(key)) byDate.set(key, []);
      byDate.get(key)!.push(slot);
    }

    const dailySummaries = Array.from(byDate.entries()).map(([dateKey, daySlots]) => {
      const totalRevenue = daySlots.reduce((sum, s) => sum + s.totalRevenue, 0);
      const avgOccupancy = daySlots.reduce((sum, s) => {
        const occ = s.workingRooms > 0 ? (s.roomsSold / s.workingRooms) * 100 : 0;
        return sum + occ;
      }, 0) / daySlots.length;
      const totalRoomsSold = daySlots.reduce((sum, s) => sum + s.roomsSold, 0);

      return {
        date: dateKey,
        slotsReported: daySlots.length,
        totalRevenue,
        avgOccupancy,
        totalRoomsSold,
      };
    });

    const weekTotalRevenue = dailySummaries.reduce((sum, d) => sum + d.totalRevenue, 0);
    const weekAvgOccupancy = dailySummaries.reduce((sum, d) => sum + d.avgOccupancy, 0) / dailySummaries.length;
    const weekTotalRoomsSold = dailySummaries.reduce((sum, d) => sum + d.totalRoomsSold, 0);

    const pdf = await generateOccupancyPDF({
      title: 'Weekly Occupancy Report',
      subtitle: `Week: ${new Date(start).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - ${new Date(end).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`,
      data: {
        daily: dailySummaries,
        summary: {
          totalRevenue: weekTotalRevenue,
          avgOccupancy: weekAvgOccupancy,
          totalRoomsSold: weekTotalRoomsSold,
          daysReported: dailySummaries.length,
        },
      },
    });

    const filename = `Weekly_Report_${startDate}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdf);
  })
);

// ─── Monthly Report (month aggregation) ──────────────────────
const monthlySchema = z.object({
  year: z.coerce.number().int().min(2020).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});

router.get(
  '/monthly',
  canDownload,
  asyncHandler(async (req, res) => {
    const { year, month } = monthlySchema.parse(req.query);
    const start = startOfDay(new Date(year, month - 1, 1));
    const end = endOfDay(new Date(year, month, 0)); // last day of month

    const slots = await prisma.occupancySlot.findMany({
      where: {
        reportDate: {
          gte: start,
          lte: end,
        },
      },
      include: {
        sales: true,
      },
      orderBy: [{ reportDate: 'asc' }, { slot: 'asc' }],
    });

    if (slots.length === 0) {
      throw notFound(`No data found for ${year}-${String(month).padStart(2, '0')}`);
    }

    // Group by date
    const byDate = new Map<string, typeof slots>();
    for (const slot of slots) {
      const key = localDateKey(slot.reportDate);
      if (!byDate.has(key)) byDate.set(key, []);
      byDate.get(key)!.push(slot);
    }

    const dailySummaries = Array.from(byDate.entries()).map(([dateKey, daySlots]) => {
      const totalRevenue = daySlots.reduce((sum, s) => sum + s.totalRevenue, 0);
      const avgOccupancy = daySlots.reduce((sum, s) => {
        const occ = s.workingRooms > 0 ? (s.roomsSold / s.workingRooms) * 100 : 0;
        return sum + occ;
      }, 0) / daySlots.length;
      const totalRoomsSold = daySlots.reduce((sum, s) => sum + s.roomsSold, 0);

      return {
        date: dateKey,
        slotsReported: daySlots.length,
        totalRevenue,
        avgOccupancy,
        totalRoomsSold,
      };
    });

    const monthTotalRevenue = dailySummaries.reduce((sum, d) => sum + d.totalRevenue, 0);
    const monthAvgOccupancy = dailySummaries.reduce((sum, d) => sum + d.avgOccupancy, 0) / dailySummaries.length;
    const monthTotalRoomsSold = dailySummaries.reduce((sum, d) => sum + d.totalRoomsSold, 0);

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const pdf = await generateOccupancyPDF({
      title: 'Monthly Occupancy Report',
      subtitle: `${monthNames[month - 1]} ${year}`,
      data: {
        daily: dailySummaries,
        summary: {
          totalRevenue: monthTotalRevenue,
          avgOccupancy: monthAvgOccupancy,
          totalRoomsSold: monthTotalRoomsSold,
          daysReported: dailySummaries.length,
        },
      },
    });

    const filename = `Monthly_Report_${year}-${String(month).padStart(2, '0')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdf);
  })
);

export default router;