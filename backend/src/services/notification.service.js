"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotification = createNotification;
exports.createNotificationOnce = createNotificationOnce;
exports.listNotificationsForUser = listNotificationsForUser;
exports.markNotificationRead = markNotificationRead;
exports.markAllNotificationsRead = markAllNotificationsRead;
const prisma_1 = __importDefault(require("../lib/prisma"));
/**
 * Creates a notification and fans it out to individual users.
 * - If userId is set: create one UserNotification for that user only.
 * - If targetRole is set: create one UserNotification per active user with that role.
 * - If both are null: create one UserNotification per active user (broadcast).
 */
async function createNotification(input) {
    // Resolve target users
    let targetUsers = [];
    if (input.userId) {
        // Specific user
        const user = await prisma_1.default.user.findUnique({ where: { id: input.userId, active: true }, select: { id: true } });
        if (user)
            targetUsers = [user];
    }
    else if (input.targetRole) {
        // Role-targeted
        targetUsers = await prisma_1.default.user.findMany({ where: { role: input.targetRole, active: true }, select: { id: true } });
    }
    else {
        // Broadcast to all active users
        targetUsers = await prisma_1.default.user.findMany({ where: { active: true }, select: { id: true } });
    }
    if (targetUsers.length === 0) {
        // No recipients — create the notification anyway (for audit trail) but with no fan-out
        return prisma_1.default.notification.create({
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
    return prisma_1.default.notification.create({
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
async function createNotificationOnce(input) {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    // Check if a notification with same type + title was created today
    const existing = await prisma_1.default.notification.findFirst({
        where: {
            type: input.type,
            title: input.title,
            createdAt: { gte: startOfToday },
        },
    });
    if (existing)
        return existing;
    return createNotification(input);
}
/**
 * List notifications for a specific user (from their UserNotification inbox).
 */
async function listNotificationsForUser(userId) {
    const userNotifications = await prisma_1.default.userNotification.findMany({
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
async function markNotificationRead(userNotificationId, userId) {
    return prisma_1.default.userNotification.updateMany({
        where: { id: userNotificationId, userId },
        data: { read: true },
    });
}
/**
 * Mark all notifications as read for a specific user.
 */
async function markAllNotificationsRead(userId) {
    return prisma_1.default.userNotification.updateMany({
        where: { userId, read: false },
        data: { read: true },
    });
}
