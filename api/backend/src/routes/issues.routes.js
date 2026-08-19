"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = __importDefault(require("../lib/prisma"));
const asyncHandler_1 = require("../lib/asyncHandler");
const auth_1 = require("../middleware/auth");
const errors_1 = require("../lib/errors");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
// ─── Complaints ───────────────────────────────────────────
router.get('/complaints', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { status } = req.query;
    const complaints = await prisma_1.default.complaint.findMany({
        where: status ? { status } : {},
        orderBy: { createdAt: 'desc' },
        take: 200,
    });
    res.json(complaints);
}));
const complaintCreateSchema = zod_1.z.object({
    details: zod_1.z.string().min(1),
    guestName: zod_1.z.string().optional().nullable(),
});
router.post('/complaints', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const data = complaintCreateSchema.parse(req.body);
    const complaint = await prisma_1.default.complaint.create({
        data: { details: data.details, guestName: data.guestName ?? null },
    });
    res.status(201).json(complaint);
}));
const statusSchema = zod_1.z.object({ status: zod_1.z.enum(['OPEN', 'CLOSED']) });
router.patch('/complaints/:id', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { status } = statusSchema.parse(req.body);
    const existing = await prisma_1.default.complaint.findUnique({ where: { id: req.params.id } });
    if (!existing)
        throw (0, errors_1.notFound)('Complaint not found');
    const complaint = await prisma_1.default.complaint.update({
        where: { id: req.params.id },
        data: { status, resolvedAt: status === 'CLOSED' ? new Date() : null },
    });
    res.json(complaint);
}));
// ─── Maintenance ──────────────────────────────────────────
router.get('/maintenance', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { status } = req.query;
    const items = await prisma_1.default.maintenanceIssue.findMany({
        where: status ? { status } : {},
        orderBy: { createdAt: 'desc' },
        take: 200,
    });
    res.json(items);
}));
const maintenanceCreateSchema = zod_1.z.object({
    details: zod_1.z.string().min(1),
    priority: zod_1.z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
});
router.post('/maintenance', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const data = maintenanceCreateSchema.parse(req.body);
    const item = await prisma_1.default.maintenanceIssue.create({
        data: { details: data.details, priority: data.priority ?? 'MEDIUM' },
    });
    res.status(201).json(item);
}));
router.patch('/maintenance/:id', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { status } = statusSchema.parse(req.body);
    const existing = await prisma_1.default.maintenanceIssue.findUnique({ where: { id: req.params.id } });
    if (!existing)
        throw (0, errors_1.notFound)('Maintenance issue not found');
    const item = await prisma_1.default.maintenanceIssue.update({
        where: { id: req.params.id },
        data: { status, resolvedAt: status === 'CLOSED' ? new Date() : null },
    });
    res.json(item);
}));
exports.default = router;
