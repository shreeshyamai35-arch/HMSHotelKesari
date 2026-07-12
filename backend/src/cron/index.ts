import cron from 'node-cron';
import prisma from '../lib/prisma';
import { env } from '../config/env';
import { startOfDay, endOfDay } from '../lib/dates';
import { createNotificationOnce } from '../services/notification.service';
import { ROLES, OCCUPANCY_SLOT_META } from '../constants/roles';

// Scheduled check definitions (local server time).
const GENSET_SCHEDULE = [
  { type: 'MORNING', hour: 7 },
  { type: 'EVENING', hour: 19 },
];
const WATER_SCHEDULE = [
  { slot: 'SLOT_0700', hour: 7 },
  { slot: 'SLOT_1200', hour: 12 },
  { slot: 'SLOT_1600', hour: 16 },
  { slot: 'SLOT_2100', hour: 21 },
];

async function checkMissedTasks() {
  const now = new Date();
  const dayStart = startOfDay(now);
  const dayEnd = endOfDay(now);
  const graceMs = env.checkGraceMinutes * 60 * 1000;

  const reports = await prisma.dailyReport.findMany({
    where: { reportDate: { gte: dayStart, lte: dayEnd } },
    include: { gensetChecks: true, waterTankChecks: true },
  });

  const gensetDone = new Set<string>();
  const waterDone = new Set<string>();
  for (const r of reports) {
    r.gensetChecks.forEach((g) => gensetDone.add(g.type));
    r.waterTankChecks.forEach((w) => waterDone.add(w.slot));
  }

  for (const g of GENSET_SCHEDULE) {
    const due = new Date(dayStart);
    due.setHours(g.hour, 0, 0, 0);
    if (now.getTime() > due.getTime() + graceMs && !gensetDone.has(g.type)) {
      await createNotificationOnce({
        type: 'MISSED_GENSET',
        title: `Missed ${g.type.toLowerCase()} genset check`,
        message: `The ${g.type.toLowerCase()} genset check (scheduled ${g.hour}:00) has not been logged today.`,
        severity: 'WARNING',
        targetRole: ROLES.ADMIN,
      });
    }
  }

  for (const w of WATER_SCHEDULE) {
    const due = new Date(dayStart);
    due.setHours(w.hour, 0, 0, 0);
    if (now.getTime() > due.getTime() + graceMs && !waterDone.has(w.slot)) {
      await createNotificationOnce({
        type: 'MISSED_WATER',
        title: `Missed water tank check (${w.hour}:00)`,
        message: `The water tank check scheduled for ${w.hour}:00 has not been logged today.`,
        severity: 'WARNING',
        targetRole: ROLES.ADMIN,
      });
    }
  }

  // Pending daily report (none submitted today, after morning grace).
  const morningDue = new Date(dayStart);
  morningDue.setHours(7, 0, 0, 0);
  if (reports.length === 0 && now.getTime() > morningDue.getTime() + graceMs) {
    await createNotificationOnce({
      type: 'PENDING_REPORT',
      title: 'Daily operations report pending',
      message: 'No daily operations report has been submitted today.',
      severity: 'WARNING',
      targetRole: ROLES.ADMIN,
    });
  }
}

async function checkMissedOccupancySlots() {
  const now = new Date();
  const dayStart = startOfDay(now);
  const dayEnd = endOfDay(now);
  const graceMs = env.checkGraceMinutes * 60 * 1000;

  const submitted = await prisma.occupancySlot.findMany({
    where: { reportDate: { gte: dayStart, lte: dayEnd } },
    select: { slot: true },
  });
  const done = new Set(submitted.map((s) => s.slot));

  for (const meta of OCCUPANCY_SLOT_META) {
    const due = new Date(dayStart);
    due.setHours(meta.scheduledHour, 0, 0, 0);
    if (now.getTime() > due.getTime() + graceMs && !done.has(meta.key)) {
      await createNotificationOnce({
        type: 'MISSED_OCCUPANCY',
        title: `Missed ${meta.label} occupancy report`,
        message: `The ${meta.label} occupancy report has not been submitted today.`,
        severity: 'WARNING',
        targetRole: ROLES.ADMIN,
      });
    }
  }
}

async function checkOpenMaintenance() {
  const open = await prisma.maintenanceIssue.count({ where: { status: 'OPEN' } });
  if (open > 0) {
    await createNotificationOnce({
      type: 'OPEN_MAINTENANCE',
      title: `${open} open maintenance issue(s)`,
      message: `There are ${open} unresolved maintenance issue(s) requiring attention.`,
      severity: open > 3 ? 'CRITICAL' : 'INFO',
      targetRole: ROLES.ADMIN,
    });
  }
}

export function startCronJobs() {
  if (!env.enableCron) {
    console.log('[cron] disabled via ENABLE_CRON=false');
    return;
  }

  // Every 30 minutes: check for missed scheduled tasks + pending report.
  cron.schedule('*/30 * * * *', () => {
    checkMissedTasks().catch((err) => console.error('[cron:missed]', err));
    checkMissedOccupancySlots().catch((err) => console.error('[cron:occupancy]', err));
  });

  // Every 2 hours: surface open maintenance issues.
  cron.schedule('0 */2 * * *', () => {
    checkOpenMaintenance().catch((err) => console.error('[cron:maintenance]', err));
  });

  console.log('[cron] scheduled jobs started');
}
