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
const roles_1 = require("../constants/roles");
const dates_1 = require("../lib/dates");
const errors_1 = require("../lib/errors");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
const gensetSchema = zod_1.z.object({
    type: zod_1.z.enum(['MORNING', 'EVENING']),
    status: zod_1.z.enum(['WORKING', 'NOT_WORKING']),
    fuelLevel: zod_1.z.enum(['FULL', 'MEDIUM', 'LOW']),
    remarks: zod_1.z.string().optional().nullable(),
    employeeName: zod_1.z.string().optional(),
});
const waterSchema = zod_1.z.object({
    slot: zod_1.z.enum(['SLOT_0700', 'SLOT_1200', 'SLOT_1600', 'SLOT_2100']),
    status: zod_1.z.enum(['FULL', 'MEDIUM', 'LOW']),
    remarks: zod_1.z.string().optional().nullable(),
    employeeName: zod_1.z.string().optional(),
});
const checklistSchema = zod_1.z.object({
    key: zod_1.z.string().min(1),
    label: zod_1.z.string().min(1),
    status: zod_1.z.string().min(1),
    remarks: zod_1.z.string().optional().nullable(),
});
const createSchema = zod_1.z.object({
    reportDate: zod_1.z.string().optional(),
    remarks: zod_1.z.string().optional().nullable(),
    gensetChecks: zod_1.z.array(gensetSchema).default([]),
    waterTankChecks: zod_1.z.array(waterSchema).default([]),
    checklistItems: zod_1.z.array(checklistSchema).default([]),
    complaints: zod_1.z.array(zod_1.z.object({ details: zod_1.z.string().min(1), guestName: zod_1.z.string().optional().nullable() })).default([]),
    maintenance: zod_1.z
        .array(zod_1.z.object({ details: zod_1.z.string().min(1), priority: zod_1.z.enum(['LOW', 'MEDIUM', 'HIGH']).optional() }))
        .default([]),
    incidents: zod_1.z
        .array(zod_1.z.object({ type: zod_1.z.enum(['LOST_FOUND', 'SPECIAL_INCIDENT']), details: zod_1.z.string().min(1) }))
        .default([]),
});
const reportInclude = {
    gensetChecks: true,
    waterTankChecks: true,
    checklistItems: true,
    complaints: true,
    maintenance: true,
    incidents: true,
    pdfReports: true,
};
// Create a daily operations report
router.post('/', (0, auth_1.authorize)(roles_1.ROLES.ADMIN, roles_1.ROLES.FRONT_OFFICE), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const data = createSchema.parse(req.body);
    const user = req.user;
    const reportDate = (0, dates_1.startOfDay)((0, dates_1.parseDate)(data.reportDate));
    const dbUser = await prisma_1.default.user.findUnique({ where: { id: user.sub } });
    const department = dbUser?.department ?? null;
    const employeeName = dbUser?.name ?? user.name;
    const report = await prisma_1.default.dailyReport.create({
        data: {
            reportDate,
            employeeId: user.sub,
            employeeName,
            department,
            remarks: data.remarks ?? null,
            gensetChecks: {
                create: data.gensetChecks.map((g) => ({
                    type: g.type,
                    status: g.status,
                    fuelLevel: g.fuelLevel,
                    remarks: g.remarks ?? null,
                    employeeName: g.employeeName ?? employeeName,
                })),
            },
            waterTankChecks: {
                create: data.waterTankChecks.map((w) => ({
                    slot: w.slot,
                    status: w.status,
                    remarks: w.remarks ?? null,
                    employeeName: w.employeeName ?? employeeName,
                })),
            },
            checklistItems: {
                create: data.checklistItems.map((c) => ({
                    key: c.key,
                    label: c.label,
                    status: c.status,
                    remarks: c.remarks ?? null,
                })),
            },
            complaints: {
                create: data.complaints.map((c) => ({ details: c.details, guestName: c.guestName ?? null })),
            },
            maintenance: {
                create: data.maintenance.map((m) => ({ details: m.details, priority: m.priority ?? 'MEDIUM' })),
            },
            incidents: {
                create: data.incidents.map((i) => ({ type: i.type, details: i.details })),
            },
        },
        include: reportInclude,
    });
    res.status(201).json(report);
}));
// List reports (filterable). Front office sees only their own.
router.get('/', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { from, to, employeeId } = req.query;
    const where = {};
    if (req.user.role === roles_1.ROLES.FRONT_OFFICE) {
        where.employeeId = req.user.sub;
    }
    else if (employeeId) {
        where.employeeId = employeeId;
    }
    if (from || to) {
        where.reportDate = {
            ...(from ? { gte: (0, dates_1.startOfDay)((0, dates_1.parseDate)(from)) } : {}),
            ...(to ? { lte: (0, dates_1.endOfDay)((0, dates_1.parseDate)(to)) } : {}),
        };
    }
    const reports = await prisma_1.default.dailyReport.findMany({
        where,
        include: reportInclude,
        orderBy: { reportDate: 'desc' },
        take: 200,
    });
    res.json(reports);
}));
router.get('/:id', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const report = await prisma_1.default.dailyReport.findUnique({
        where: { id: req.params.id },
        include: reportInclude,
    });
    if (!report)
        throw (0, errors_1.notFound)('Report not found');
    if (req.user.role === roles_1.ROLES.FRONT_OFFICE && report.employeeId !== req.user.sub) {
        throw (0, errors_1.notFound)('Report not found');
    }
    res.json(report);
}));
exports.default = router;
