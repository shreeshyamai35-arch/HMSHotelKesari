import path from 'path';
import fs from 'fs';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PdfPrinter = require('pdfmake');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const vfs = require('pdfmake/build/vfs_fonts.js');

// vfs_fonts exports the font files (base64) keyed by filename. Handle the
// few shapes pdfmake has used across versions.
const vfsFiles: Record<string, string> =
  vfs?.pdfMake?.vfs ?? vfs?.vfs ?? vfs;

function fontBuffer(name: string): Buffer {
  const data = vfsFiles[name];
  if (!data) throw new Error(`Embedded font not found: ${name}`);
  return Buffer.from(data, 'base64');
}

const printer = new PdfPrinter({
  Roboto: {
    normal: fontBuffer('Roboto-Regular.ttf'),
    bold: fontBuffer('Roboto-Medium.ttf'),
    italics: fontBuffer('Roboto-Italic.ttf'),
    bolditalics: fontBuffer('Roboto-MediumItalic.ttf'),
  },
});

export const STORAGE_DIR = path.resolve(process.cwd(), 'storage', 'pdf');

function ensureStorageDir() {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }
}

const NAVY = '#131b2e';
const GOLD = '#7c580f';
const SLATE = '#45464d';

interface ReportData {
  id: string;
  reportDate: Date;
  employeeName: string;
  department: string | null;
  submittedAt: Date;
  remarks: string | null;
  gensetChecks: { type: string; status: string; fuelLevel: string; remarks: string | null; employeeName: string }[];
  waterTankChecks: { slot: string; status: string; remarks: string | null; employeeName: string }[];
  checklistItems: { label: string; status: string; remarks: string | null }[];
  complaints: { details: string; guestName: string | null; status: string }[];
  maintenance: { details: string; priority: string; status: string }[];
  incidents: { type: string; details: string }[];
}

const SLOT_LABELS: Record<string, string> = {
  SLOT_0700: '7:00 AM',
  SLOT_1200: '12:00 PM',
  SLOT_1600: '4:00 PM',
  SLOT_2100: '9:00 PM',
};

function fmtDate(d: Date): string {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtDateTime(d: Date): string {
  return new Date(d).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function sectionHeader(text: string) {
  return { text, style: 'sectionHeader', margin: [0, 14, 0, 6] as [number, number, number, number] };
}

function buildDocDefinition(report: ReportData) {
  const content: any[] = [];

  // Brand header
  content.push({
    columns: [
      { text: 'HOTEL KESARI', style: 'brand' },
      { text: 'Daily Operations Report', style: 'docTitle', alignment: 'right' },
    ],
  });
  content.push({
    canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1.5, lineColor: GOLD }],
    margin: [0, 6, 0, 10],
  });

  // Meta
  content.push({
    columns: [
      { text: [{ text: 'Date: ', bold: true }, fmtDate(report.reportDate)] },
      { text: [{ text: 'Employee: ', bold: true }, report.employeeName] },
      { text: [{ text: 'Submitted: ', bold: true }, fmtDateTime(report.submittedAt)] },
    ],
    style: 'meta',
  });
  if (report.department) {
    content.push({ text: [{ text: 'Department: ', bold: true }, report.department], style: 'meta' });
  }

  // Genset
  content.push(sectionHeader('Genset Checks'));
  if (report.gensetChecks.length) {
    content.push({
      table: {
        widths: ['*', '*', '*', '*'],
        body: [
          [
            { text: 'Type', style: 'th' },
            { text: 'Status', style: 'th' },
            { text: 'Fuel Level', style: 'th' },
            { text: 'Remarks', style: 'th' },
          ],
          ...report.gensetChecks.map((g) => [
            g.type,
            g.status.replace('_', ' '),
            g.fuelLevel,
            g.remarks ?? '-',
          ]),
        ],
      },
      layout: 'lightHorizontalLines',
    });
  } else {
    content.push({ text: 'No genset checks recorded.', style: 'empty' });
  }

  // Water tank
  content.push(sectionHeader('Water Tank Checks'));
  if (report.waterTankChecks.length) {
    content.push({
      table: {
        widths: ['*', '*', '*'],
        body: [
          [
            { text: 'Slot', style: 'th' },
            { text: 'Status', style: 'th' },
            { text: 'Remarks', style: 'th' },
          ],
          ...report.waterTankChecks.map((w) => [SLOT_LABELS[w.slot] ?? w.slot, w.status, w.remarks ?? '-']),
        ],
      },
      layout: 'lightHorizontalLines',
    });
  } else {
    content.push({ text: 'No water tank checks recorded.', style: 'empty' });
  }

  // Utility checklist
  content.push(sectionHeader('Utility & Operations Checklist'));
  if (report.checklistItems.length) {
    content.push({
      table: {
        widths: ['*', 'auto', '*'],
        body: [
          [
            { text: 'Item', style: 'th' },
            { text: 'Status', style: 'th' },
            { text: 'Remarks', style: 'th' },
          ],
          ...report.checklistItems.map((c) => [c.label, c.status, c.remarks ?? '-']),
        ],
      },
      layout: 'lightHorizontalLines',
    });
  } else {
    content.push({ text: 'No checklist items recorded.', style: 'empty' });
  }

  // Issues
  content.push(sectionHeader('Guest Complaints'));
  content.push(
    report.complaints.length
      ? { ul: report.complaints.map((c) => `${c.guestName ? c.guestName + ': ' : ''}${c.details} (${c.status})`) }
      : { text: 'None reported.', style: 'empty' }
  );

  content.push(sectionHeader('Maintenance Issues'));
  content.push(
    report.maintenance.length
      ? { ul: report.maintenance.map((m) => `[${m.priority}] ${m.details} (${m.status})`) }
      : { text: 'None reported.', style: 'empty' }
  );

  content.push(sectionHeader('Incidents / Lost & Found'));
  content.push(
    report.incidents.length
      ? { ul: report.incidents.map((i) => `[${i.type.replace('_', ' ')}] ${i.details}`) }
      : { text: 'None reported.', style: 'empty' }
  );

  if (report.remarks) {
    content.push(sectionHeader('General Remarks'));
    content.push({ text: report.remarks });
  }

  return {
    content,
    defaultStyle: { font: 'Roboto', fontSize: 10, color: '#0b1c30' },
    styles: {
      brand: { fontSize: 20, bold: true, color: NAVY },
      docTitle: { fontSize: 12, bold: true, color: GOLD, margin: [0, 6, 0, 0] },
      sectionHeader: { fontSize: 12, bold: true, color: NAVY },
      meta: { fontSize: 9, color: SLATE, margin: [0, 2, 0, 2] },
      th: { bold: true, fillColor: '#eff4ff', color: NAVY, fontSize: 9 },
      empty: { italics: true, color: SLATE },
    },
    footer: (currentPage: number, pageCount: number) => ({
      text: `Hotel Kesari — Operations Report  |  Page ${currentPage} of ${pageCount}`,
      alignment: 'center',
      fontSize: 8,
      color: SLATE,
      margin: [0, 10, 0, 0],
    }),
    pageMargins: [40, 40, 40, 50] as [number, number, number, number],
  };
}

export async function generateReportPdf(report: ReportData): Promise<{ fileName: string; filePath: string }> {
  ensureStorageDir();
  const fileName = `report-${report.id}-${Date.now()}.pdf`;
  const filePath = path.join(STORAGE_DIR, fileName);

  const docDefinition = buildDocDefinition(report);
  const pdfDoc = printer.createPdfKitDocument(docDefinition);

  await new Promise<void>((resolve, reject) => {
    const stream = fs.createWriteStream(filePath);
    pdfDoc.pipe(stream);
    pdfDoc.on('error', reject);
    stream.on('error', reject);
    stream.on('finish', () => resolve());
    pdfDoc.end();
  });

  return { fileName, filePath };
}
