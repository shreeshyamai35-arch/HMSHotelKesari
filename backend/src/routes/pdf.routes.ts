import { Router } from 'express';
import fs from 'fs';
import prisma from '../lib/prisma';
import { asyncHandler } from '../lib/asyncHandler';
import { authenticate } from '../middleware/auth';
import { ROLES } from '../constants/roles';
import { generateReportPdf } from '../services/pdf.service';
import { notFound } from '../lib/errors';

const router = Router();
router.use(authenticate);

const reportInclude = {
  gensetChecks: true,
  waterTankChecks: true,
  checklistItems: true,
  complaints: true,
  maintenance: true,
  incidents: true,
} as const;

// Generate (or regenerate) a PDF for a given report
router.post(
  '/reports/:reportId/generate',
  asyncHandler(async (req, res) => {
    const report = await prisma.dailyReport.findUnique({
      where: { id: req.params.reportId },
      include: reportInclude,
    });
    if (!report) throw notFound('Report not found');
    if (req.user!.role === ROLES.FRONT_OFFICE && report.employeeId !== req.user!.sub) {
      throw notFound('Report not found');
    }

    const { fileName, filePath } = await generateReportPdf(report as never);
    const pdfRecord = await prisma.pdfReport.create({
      data: { reportId: report.id, fileName, filePath },
    });
    res.status(201).json(pdfRecord);
  })
);

// List generated PDFs for a report
router.get(
  '/reports/:reportId',
  asyncHandler(async (req, res) => {
    const pdfs = await prisma.pdfReport.findMany({
      where: { reportId: req.params.reportId },
      orderBy: { generatedAt: 'desc' },
    });
    res.json(pdfs);
  })
);

// Download a generated PDF (generates on the fly if file is missing)
router.get(
  '/:pdfId/download',
  asyncHandler(async (req, res) => {
    const pdf = await prisma.pdfReport.findUnique({ where: { id: req.params.pdfId } });
    if (!pdf) throw notFound('PDF not found');

    if (!fs.existsSync(pdf.filePath)) {
      // Regenerate from the source report if the file was removed.
      const report = await prisma.dailyReport.findUnique({
        where: { id: pdf.reportId },
        include: reportInclude,
      });
      if (!report) throw notFound('Source report not found');
      const { filePath } = await generateReportPdf(report as never);
      await prisma.pdfReport.update({ where: { id: pdf.id }, data: { filePath } });
      return res.download(filePath, pdf.fileName);
    }

    res.download(pdf.filePath, pdf.fileName);
  })
);

export default router;
