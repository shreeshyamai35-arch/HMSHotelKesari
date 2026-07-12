import { Router } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler } from '../lib/asyncHandler';
import { authenticate } from '../middleware/auth';
import { listNotificationsForUser } from '../services/notification.service';
import { notFound } from '../lib/errors';

const router = Router();
router.use(authenticate);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const notifications = await listNotificationsForUser(req.user!.sub, req.user!.role);
    res.json(notifications);
  })
);

router.get(
  '/unread-count',
  asyncHandler(async (req, res) => {
    const notifications = await listNotificationsForUser(req.user!.sub, req.user!.role);
    res.json({ count: notifications.filter((n) => !n.read).length });
  })
);

router.patch(
  '/:id/read',
  asyncHandler(async (req, res) => {
    const existing = await prisma.notification.findUnique({ where: { id: req.params.id } });
    if (!existing) throw notFound('Notification not found');
    const updated = await prisma.notification.update({
      where: { id: req.params.id },
      data: { read: true },
    });
    res.json(updated);
  })
);

router.post(
  '/read-all',
  asyncHandler(async (req, res) => {
    await prisma.notification.updateMany({
      where: {
        OR: [{ userId: req.user!.sub }, { userId: null, targetRole: req.user!.role }, { userId: null, targetRole: null }],
        read: false,
      },
      data: { read: true },
    });
    res.json({ success: true });
  })
);

export default router;
