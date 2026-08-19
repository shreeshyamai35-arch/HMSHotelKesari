"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const asyncHandler_1 = require("../lib/asyncHandler");
const auth_1 = require("../middleware/auth");
const notification_service_1 = require("../services/notification.service");
const errors_1 = require("../lib/errors");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const notifications = await (0, notification_service_1.listNotificationsForUser)(req.user.sub);
    res.json(notifications);
}));
router.get('/unread-count', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const notifications = await (0, notification_service_1.listNotificationsForUser)(req.user.sub);
    res.json({ count: notifications.filter((n) => !n.read).length });
}));
router.patch('/:id/read', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const result = await (0, notification_service_1.markNotificationRead)(req.params.id, req.user.sub);
    if (result.count === 0)
        throw (0, errors_1.notFound)('Notification not found');
    res.json({ success: true });
}));
router.post('/read-all', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    await (0, notification_service_1.markAllNotificationsRead)(req.user.sub);
    res.json({ success: true });
}));
exports.default = router;
