import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler';
import { authenticate } from '../middleware/auth';
import { listNotificationsForUser, markNotificationRead, markAllNotificationsRead } from '../services/notification.service';
import { notFound } from '../lib/errors';

const router = Router();
router.use(authenticate);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const notifications = await listNotificationsForUser(req.user!.sub);
    res.json(notifications);
  })
);

router.get(
  '/unread-count',
  asyncHandler(async (req, res) => {
    const notifications = await listNotificationsForUser(req.user!.sub);
    res.json({ count: notifications.filter((n) => !n.read).length });
  })
);

router.patch(
  '/:id/read',
  asyncHandler(async (req, res) => {
    const result = await markNotificationRead(req.params.id, req.user!.sub);
    if (result.count === 0) throw notFound('Notification not found');
    res.json({ success: true });
  })
);

router.post(
  '/read-all',
  asyncHandler(async (req, res) => {
    await markAllNotificationsRead(req.user!.sub);
    res.json({ success: true });
  })
);

export default router;
