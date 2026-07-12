import prisma from '../lib/prisma';

interface CreateNotificationInput {
  type: string;
  title: string;
  message: string;
  severity?: 'INFO' | 'WARNING' | 'CRITICAL';
  userId?: string | null;
  targetRole?: string | null;
}

export async function createNotification(input: CreateNotificationInput) {
  return prisma.notification.create({
    data: {
      type: input.type,
      title: input.title,
      message: input.message,
      severity: input.severity ?? 'INFO',
      userId: input.userId ?? null,
      targetRole: input.targetRole ?? null,
    },
  });
}

/**
 * Creates a notification only if an identical unread one (same type + title)
 * was not already created today. Prevents cron jobs from spamming duplicates.
 */
export async function createNotificationOnce(input: CreateNotificationInput) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const existing = await prisma.notification.findFirst({
    where: {
      type: input.type,
      title: input.title,
      createdAt: { gte: startOfToday },
    },
  });
  if (existing) return existing;
  return createNotification(input);
}

export async function listNotificationsForUser(userId: string, role: string) {
  return prisma.notification.findMany({
    where: {
      OR: [{ userId }, { userId: null, targetRole: role }, { userId: null, targetRole: null }],
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
}
