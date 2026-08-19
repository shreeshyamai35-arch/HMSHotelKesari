"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const fs_1 = __importDefault(require("fs"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const asyncHandler_1 = require("../lib/asyncHandler");
const auth_1 = require("../middleware/auth");
const roles_1 = require("../constants/roles");
const pdf_service_1 = require("../services/pdf.service");
const errors_1 = require("../lib/errors");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
const reportInclude = {
    gensetChecks: true,
    waterTankChecks: true,
    checklistItems: true,
    complaints: true,
    maintenance: true,
    incidents: true,
};
// Generate (or regenerate) a PDF for a given report
router.post('/reports/:reportId/generate', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const report = await prisma_1.default.dailyReport.findUnique({
        where: { id: req.params.reportId },
        include: reportInclude,
    });
    if (!report)
        throw (0, errors_1.notFound)('Report not found');
    if (req.user.role === roles_1.ROLES.FRONT_OFFICE && report.employeeId !== req.user.sub) {
        throw (0, errors_1.notFound)('Report not found');
    }
    const { fileName, filePath } = await (0, pdf_service_1.generateReportPdf)(report);
    const pdfRecord = await prisma_1.default.pdfReport.create({
        data: { reportId: report.id, fileName, filePath },
    });
    res.status(201).json(pdfRecord);
}));
// List generated PDFs for a report
router.get('/reports/:reportId', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const pdfs = await prisma_1.default.pdfReport.findMany({
        where: { reportId: req.params.reportId },
        orderBy: { generatedAt: 'desc' },
    });
    res.json(pdfs);
}));
// Download a generated PDF (generates on the fly if file is missing)
router.get('/:pdfId/download', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const pdf = await prisma_1.default.pdfReport.findUnique({ where: { id: req.params.pdfId } });
    if (!pdf)
        throw (0, errors_1.notFound)('PDF not found');
    if (!fs_1.default.existsSync(pdf.filePath)) {
        // Regenerate from the source report if the file was removed.
        const report = await prisma_1.default.dailyReport.findUnique({
            where: { id: pdf.reportId },
            include: reportInclude,
        });
        if (!report)
            throw (0, errors_1.notFound)('Source report not found');
        const { filePath } = await (0, pdf_service_1.generateReportPdf)(report);
        await prisma_1.default.pdfReport.update({ where: { id: pdf.id }, data: { filePath } });
        return res.download(filePath, pdf.fileName);
    }
    res.download(pdf.filePath, pdf.fileName);
}));
exports.default = router;
