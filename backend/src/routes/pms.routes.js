"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const asyncHandler_1 = require("../lib/asyncHandler");
const auth_1 = require("../middleware/auth");
const roles_1 = require("../constants/roles");
const pms_service_1 = require("../services/pms.service");
const dates_1 = require("../lib/dates");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate, (0, auth_1.authorize)(roles_1.ROLES.ADMIN, roles_1.ROLES.REVENUE));
const syncSchema = zod_1.z.object({
    from: zod_1.z.string().optional(),
    to: zod_1.z.string().optional(),
});
router.post('/sync', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { from, to } = syncSchema.parse(req.body ?? {});
    const toDate = to ? (0, dates_1.parseDate)(to) : new Date();
    const fromDate = from ? (0, dates_1.parseDate)(from) : (0, dates_1.addDays)(toDate, -30);
    const result = await (0, pms_service_1.syncPms)(fromDate, toDate);
    res.json({ success: true, ...result });
}));
exports.default = router;
