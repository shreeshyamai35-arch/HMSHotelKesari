import prisma from '../lib/prisma';

interface CreateNotificationInput {
  type: string;
  title: string;
  message: string;
  severity?: 'INFO' | 'WARNING' | 'CRITICAL';
  userId?: string | null;
  targetRole?: string | null;
}

/**
 * Creates a notification and fans it out to individual users.
 * - If userId is set: create one UserNotification for that user only.
 * - If targetRole is set: create one UserNotification per active user with that role.
 * - If both are null: create one UserNotification per active user (broadcast).
 */
export async function createNotification(input: CreateNotificationInput) {
  // Resolve target users
  let targetUsers: { id: string }[] = [];

  if (input.userId) {
    // Specific user
    const user = await prisma.user.findUnique({ where: { id: input.userId, active: true }, select: { id: true } });
    if (user) targetUsers = [user];
  } else if (input.targetRole) {
    // Role-targeted
    targetUsers = await prisma.user.findMany({ where: { role: input.targetRole, active: true }, select: { id: true } });
  } else {
    // Broadcast to all active users
    targetUsers = await prisma.user.findMany({ where: { active: true }, select: { id: true } });
  }

  if (targetUsers.length === 0) {
    // No recipients — create the notification anyway (for audit trail) but with no fan-out
    return prisma.notification.create({
      data: {
        type: input.type,
        title: input.title,
        message: input.message,
        severity: input.severity ?? 'INFO',
        targetRole: input.targetRole ?? null,
      },
    });
  }

  // Create notification + fan out to users
  return prisma.notification.create({
    data: {
      type: input.type,
      title: input.title,
      message: input.message,
      severity: input.severity ?? 'INFO',
      targetRole: input.targetRole ?? null,
      recipients: {
        create: targetUsers.map((u) => ({ userId: u.id })),
      },
    },
    include: { recipients: true },
  });
}

/**
 * Creates a notification only if an identical unread one (same type + title) for
 * the same recipients was not already created today. Prevents cron spam.
 */
export async function createNotificationOnce(input: CreateNotificationInput) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  // Check if a notification with same type + title was created today
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

/**
 * List notifications for a specific user (from their UserNotification inbox).
 */
export async function listNotificationsForUser(userId: string) {
  const userNotifications = await prisma.userNotification.findMany({
    where: { userId },
    include: { notification: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return userNotifications.map((un) => ({
    id: un.id,
    notificationId: un.notificationId,
    type: un.notification.type,
    title: un.notification.title,
    message: un.notification.message,
    severity: un.notification.severity,
    targetRole: un.notification.targetRole,
    read: un.read,
    createdAt: un.createdAt,
  }));
}

/**
 * Mark a UserNotification as read for a specific user.
 */
export async function markNotificationRead(userNotificationId: string, userId: string) {
  return prisma.userNotification.updateMany({
    where: { id: userNotificationId, userId },
    data: { read: true },
  });
}

/**
 * Mark all notifications as read for a specific user.
 */
export async function markAllNotificationsRead(userId: string) {
  return prisma.userNotification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
}
