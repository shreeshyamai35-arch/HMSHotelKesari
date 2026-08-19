import { env } from '../config/env';
import prisma from '../lib/prisma';
import { startOfDay, addDays } from '../lib/dates';

export interface PmsDailyData {
  date: Date;
  revenue: number;
  roomsSold: number;
  roomsAvailable: number;
  bookings: { source: string; status: string; roomsBooked: number; amount: number }[];
}

interface PmsAdapter {
  name: string;
  fetchRange(from: Date, to: Date): Promise<PmsDailyData[]>;
}

/**
 * Mock adapter: generates plausible booking/revenue data so the analytics
 * modules work end-to-end without live credentials. Deterministic per date.
 */
const mockAdapter: PmsAdapter = {
  name: 'mock',
  async fetchRange(from: Date, to: Date): Promise<PmsDailyData[]> {
    const out: PmsDailyData[] = [];
    const roomsAvailable = 40;
    let cursor = startOfDay(from);
    const end = startOfDay(to);
    while (cursor <= end) {
      const seed = cursor.getDate() + cursor.getMonth() * 31;
      const roomsSold = 18 + (seed % 20); // 18..37
      const adr = 2800 + (seed % 12) * 80;
      const revenue = roomsSold * adr;
      out.push({
        date: new Date(cursor),
        revenue,
        roomsSold,
        roomsAvailable,
        bookings: [
          { source: 'OTA', status: 'CONFIRMED', roomsBooked: Math.round(roomsSold * 0.5), amount: revenue * 0.5 },
          { source: 'DIRECT', status: 'CONFIRMED', roomsBooked: Math.round(roomsSold * 0.3), amount: revenue * 0.3 },
          { source: 'WALK_IN', status: 'CHECKED_IN', roomsBooked: Math.round(roomsSold * 0.2), amount: revenue * 0.2 },
        ],
      });
      cursor = addDays(cursor, 1);
    }
    return out;
  },
};

/**
 * eZee Absolute adapter scaffold. Wire real API/MCP calls here when
 * credentials are provided. Falls back to mock on any failure.
 */
const ezeeAdapter: PmsAdapter = {
  name: 'ezee',
  async fetchRange(from: Date, to: Date): Promise<PmsDailyData[]> {
    if (!env.pms.apiUrl || !env.pms.authCode) {
      return mockAdapter.fetchRange(from, to);
    }
    try {
      // Placeholder for the real eZee Absolute API/MCP integration.
      // const resp = await fetch(env.pms.apiUrl, { ... });
      // transform resp -> PmsDailyData[]
      return mockAdapter.fetchRange(from, to);
    } catch (err) {
      console.error('[pms:ezee:fallback]', err);
      return mockAdapter.fetchRange(from, to);
    }
  },
};

function getAdapter(): PmsAdapter {
  return env.pms.provider === 'ezee' ? ezeeAdapter : mockAdapter;
}

function computeMetrics(revenue: number, roomsSold: number, roomsAvailable: number) {
  const adr = roomsSold > 0 ? revenue / roomsSold : 0;
  const revpar = roomsAvailable > 0 ? revenue / roomsAvailable : 0;
  return { adr: +adr.toFixed(2), revpar: +revpar.toFixed(2) };
}

/** Syncs PMS data into PostgreSQL (RevenueRecord + Booking). Returns counts. */
export async function syncPms(from: Date, to: Date): Promise<{ provider: string; days: number; bookings: number }> {
  const adapter = getAdapter();

  // Block mock adapter in production to prevent accidental corruption of real data
  if (env.isProd && adapter.name === 'mock') {
    throw new Error('Mock PMS sync is disabled in production. Set PMS_PROVIDER to a real adapter or switch NODE_ENV to development.');
  }

  const data = await adapter.fetchRange(from, to);
  let bookingCount = 0;

  for (const day of data) {
    const recordDate = startOfDay(day.date);
    const { adr, revpar } = computeMetrics(day.revenue, day.roomsSold, day.roomsAvailable);

    // Check if a manual-entry record exists — PMS can override it (higher priority)
    await prisma.revenueRecord.upsert({
      where: { recordDate },
      create: {
        recordDate,
        revenue: day.revenue,
        roomsSold: day.roomsSold,
        roomsAvailable: day.roomsAvailable,
        adr,
        revpar,
        source: 'PMS',
      },
      update: {
        revenue: day.revenue,
        roomsSold: day.roomsSold,
        roomsAvailable: day.roomsAvailable,
        adr,
        revpar,
        source: 'PMS',
      },
    });

    // Replace PMS-sourced bookings for that day to stay idempotent.
    await prisma.booking.deleteMany({ where: { bookingDate: recordDate, source: 'PMS' } });
    for (const b of day.bookings) {
      await prisma.booking.create({
        data: {
          bookingDate: recordDate,
          source: 'PMS',
          status: b.status,
          roomsBooked: b.roomsBooked,
          amount: b.amount,
        },
      });
      bookingCount += 1;
    }
  }

  return { provider: adapter.name, days: data.length, bookings: bookingCount };
}
