"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../lib/prisma"));
const asyncHandler_1 = require("../lib/asyncHandler");
const auth_1 = require("../middleware/auth");
const roles_1 = require("../constants/roles");
const dates_1 = require("../lib/dates");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate, (0, auth_1.authorize)(roles_1.ROLES.ADMIN, roles_1.ROLES.MANAGEMENT, roles_1.ROLES.REVENUE));
router.get('/', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { from, to } = req.query;
    const fromDate = from ? (0, dates_1.startOfDay)((0, dates_1.parseDate)(from)) : (0, dates_1.startOfDay)((0, dates_1.addDays)(new Date(), -30));
    const toDate = to ? (0, dates_1.endOfDay)((0, dates_1.parseDate)(to)) : (0, dates_1.endOfDay)(new Date());
    const reports = await prisma_1.default.dailyReport.findMany({
        where: { reportDate: { gte: fromDate, lte: toDate } },
        include: {
            gensetChecks: true,
            waterTankChecks: true,
            checklistItems: true,
        },
    });
    const byEmployee = {};
    for (const r of reports) {
        if (!byEmployee[r.employeeId]) {
            byEmployee[r.employeeId] = {
                employeeId: r.employeeId,
                employeeName: r.employeeName,
                department: r.department,
                reports: 0,
                gensetChecks: 0,
                waterChecks: 0,
                checklistItems: 0,
                tasks: 0,
            };
        }
        const e = byEmployee[r.employeeId];
        e.reports += 1;
        e.gensetChecks += r.gensetChecks.length;
        e.waterChecks += r.waterTankChecks.length;
        e.checklistItems += r.checklistItems.length;
        e.tasks += r.gensetChecks.length + r.waterTankChecks.length + r.checklistItems.length;
    }
    const byDepartment = {};
    for (const e of Object.values(byEmployee)) {
        const dept = e.department ?? 'Unassigned';
        if (!byDepartment[dept])
            byDepartment[dept] = { department: dept, reports: 0, tasks: 0 };
        byDepartment[dept].reports += e.reports;
        byDepartment[dept].tasks += e.tasks;
    }
    res.json({
        from: fromDate,
        to: toDate,
        employees: Object.values(byEmployee).sort((a, b) => b.tasks - a.tasks),
        departments: Object.values(byDepartment).sort((a, b) => b.tasks - a.tasks),
        totals: {
            reports: reports.length,
            tasks: Object.values(byEmployee).reduce((s, e) => s + e.tasks, 0),
        },
    });
}));
exports.default = router;
