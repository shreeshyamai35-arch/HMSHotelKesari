"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOccupancyPDF = generateOccupancyPDF;
const pdfkit_1 = __importDefault(require("pdfkit"));
function formatCurrency(amount) {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function formatDateTime(date) {
    return new Date(date).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}
async function generateOccupancyPDF(report) {
    return new Promise((resolve, reject) => {
        const doc = new pdfkit_1.default({ size: 'A4', margin: 50 });
        const chunks = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
        // Header
        doc.fontSize(20).font('Helvetica-Bold').text('Hotel Kesari', { align: 'center' });
        doc.fontSize(10).font('Helvetica').text('Varanasi, Uttar Pradesh', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(16).font('Helvetica-Bold').text(report.title, { align: 'center' });
        doc.fontSize(11).font('Helvetica').text(report.subtitle, { align: 'center' });
        doc.moveDown(1);
        // Hourly report (single slot)
        if (report.data.sales && !report.data.slots) {
            renderSingleSlot(doc, report.data);
        }
        // Daily report (multiple slots)
        if (report.data.slots) {
            renderDailyReport(doc, report.data);
        }
        // Weekly/Monthly report (daily summaries)
        if (report.data.daily) {
            renderPeriodReport(doc, report.data);
        }
        // Footer
        doc.fontSize(8).font('Helvetica').text(`Generated on ${formatDateTime(new Date())}`, 50, doc.page.height - 50, { align: 'center' });
        doc.end();
    });
}
function renderSingleSlot(doc, data) {
    const y = doc.y;
    // Summary boxes
    doc.fontSize(10).font('Helvetica-Bold');
    const boxWidth = 120;
    const boxHeight = 50;
    const startX = 50;
    let x = startX;
    const metrics = [
        { label: 'Total Rooms', value: data.totalRooms },
        { label: 'Working', value: data.workingRooms },
        { label: 'Out of Order', value: data.outOfOrder },
        { label: 'Rooms Sold', value: data.roomsSold },
    ];
    metrics.forEach((m, i) => {
        if (i > 0 && i % 4 === 0) {
            x = startX;
            doc.y += boxHeight + 10;
        }
        drawBox(doc, x, doc.y, boxWidth, boxHeight, m.label, String(m.value ?? 0));
        x += boxWidth + 10;
    });
    doc.y += boxHeight + 10;
    x = startX;
    drawBox(doc, x, doc.y, boxWidth, boxHeight, 'Occupancy', `${data.occupancy?.toFixed(1)}%`);
    x += boxWidth + 10;
    drawBox(doc, x, doc.y, boxWidth, boxHeight, 'Revenue', formatCurrency(data.revenue ?? 0));
    doc.y += boxHeight + 20;
    // Room sales table
    if (data.sales && data.sales.length > 0) {
        doc.fontSize(12).font('Helvetica-Bold').text('Room Sales', 50, doc.y);
        doc.moveDown(0.5);
        const tableTop = doc.y;
        const colWidths = [60, 80, 100, 140, 90];
        const headers = ['Room', 'Type', 'Source', 'Detail', 'Price'];
        // Table header
        doc.fontSize(9).font('Helvetica-Bold');
        let colX = 50;
        headers.forEach((h, i) => {
            doc.text(h, colX, tableTop, { width: colWidths[i], align: i === 4 ? 'right' : 'left' });
            colX += colWidths[i];
        });
        doc.moveTo(50, tableTop + 15).lineTo(520, tableTop + 15).stroke();
        doc.y = tableTop + 20;
        // Table rows
        doc.font('Helvetica').fontSize(8);
        data.sales.forEach((sale) => {
            const rowY = doc.y;
            colX = 50;
            doc.text(sale.roomNumber, colX, rowY, { width: colWidths[0] });
            colX += colWidths[0];
            doc.text(sale.roomType, colX, rowY, { width: colWidths[1] });
            colX += colWidths[1];
            doc.text(sale.source, colX, rowY, { width: colWidths[2] });
            colX += colWidths[2];
            doc.text(sale.sourceDetail ?? '—', colX, rowY, { width: colWidths[3] });
            colX += colWidths[3];
            doc.text(formatCurrency(sale.priceSold), colX, rowY, { width: colWidths[4], align: 'right' });
            doc.moveDown(0.8);
        });
    }
    // Notes
    if (data.notes) {
        doc.moveDown(1);
        doc.fontSize(10).font('Helvetica-Bold').text('Notes:', 50);
        doc.fontSize(9).font('Helvetica').text(data.notes, 50, doc.y, { width: 495 });
    }
    // Submitted by
    if (data.submittedBy && data.submittedAt) {
        doc.moveDown(1);
        doc.fontSize(8).font('Helvetica').text(`Submitted by ${data.submittedBy} on ${formatDateTime(data.submittedAt)}`, 50, doc.y, { align: 'left' });
    }
}
function renderDailyReport(doc, data) {
    if (!data.slots)
        return;
    data.slots.forEach((slot, index) => {
        if (index > 0) {
            doc.moveDown(1.5);
            doc.moveTo(50, doc.y).lineTo(520, doc.y).stroke();
            doc.moveDown(1);
        }
        doc.fontSize(12).font('Helvetica-Bold').text(`${slot.slotLabel} Report`, 50, doc.y);
        doc.moveDown(0.5);
        // Slot summary
        doc.fontSize(9).font('Helvetica');
        const metrics = [
            `Total: ${slot.totalRooms}`,
            `Working: ${slot.workingRooms}`,
            `Out of Order: ${slot.outOfOrder}`,
            `Sold: ${slot.roomsSold}`,
            `Occupancy: ${slot.occupancy.toFixed(1)}%`,
            `Revenue: ${formatCurrency(slot.revenue)}`,
        ];
        doc.text(metrics.join('  •  '), 50, doc.y);
        doc.moveDown(0.5);
        if (slot.sales.length > 0) {
            const tableTop = doc.y;
            const colWidths = [60, 80, 100, 140, 90];
            const headers = ['Room', 'Type', 'Source', 'Detail', 'Price'];
            doc.fontSize(8).font('Helvetica-Bold');
            let colX = 50;
            headers.forEach((h, i) => {
                doc.text(h, colX, tableTop, { width: colWidths[i], align: i === 4 ? 'right' : 'left' });
                colX += colWidths[i];
            });
            doc.moveTo(50, tableTop + 12).lineTo(520, tableTop + 12).stroke();
            doc.y = tableTop + 16;
            doc.font('Helvetica').fontSize(7);
            slot.sales.forEach((sale) => {
                const rowY = doc.y;
                colX = 50;
                doc.text(sale.roomNumber, colX, rowY, { width: colWidths[0] });
                colX += colWidths[0];
                doc.text(sale.roomType, colX, rowY, { width: colWidths[1] });
                colX += colWidths[1];
                doc.text(sale.source, colX, rowY, { width: colWidths[2] });
                colX += colWidths[2];
                doc.text(sale.sourceDetail ?? '—', colX, rowY, { width: colWidths[3] });
                colX += colWidths[3];
                doc.text(formatCurrency(sale.priceSold), colX, rowY, { width: colWidths[4], align: 'right' });
                doc.moveDown(0.7);
            });
        }
        if (slot.notes) {
            doc.moveDown(0.3);
            doc.fontSize(8).font('Helvetica').text(`Notes: ${slot.notes}`, 50, doc.y, { width: 495 });
        }
        doc.fontSize(7).font('Helvetica').text(`Submitted by ${slot.submittedBy} on ${formatDateTime(slot.submittedAt)}`, 50, doc.y + 5);
    });
    // Daily summary
    if (data.summary) {
        doc.moveDown(1.5);
        doc.moveTo(50, doc.y).lineTo(520, doc.y).stroke();
        doc.moveDown(0.5);
        doc.fontSize(11).font('Helvetica-Bold').text('Daily Summary', 50, doc.y);
        doc.moveDown(0.3);
        doc.fontSize(9).font('Helvetica');
        const summary = [
            `Slots Reported: ${data.summary.slotsReported}`,
            `Total Revenue: ${formatCurrency(data.summary.totalRevenue ?? 0)}`,
            `Avg Occupancy: ${data.summary.avgOccupancy?.toFixed(1)}%`,
        ];
        doc.text(summary.join('  •  '), 50, doc.y);
    }
}
function renderPeriodReport(doc, data) {
    if (!data.daily)
        return;
    doc.fontSize(11).font('Helvetica-Bold').text('Daily Breakdown', 50, doc.y);
    doc.moveDown(0.5);
    const tableTop = doc.y;
    const colWidths = [100, 80, 100, 90, 100];
    const headers = ['Date', 'Slots', 'Rooms Sold', 'Occupancy', 'Revenue'];
    doc.fontSize(9).font('Helvetica-Bold');
    let colX = 50;
    headers.forEach((h, i) => {
        doc.text(h, colX, tableTop, { width: colWidths[i], align: i >= 2 ? 'right' : 'left' });
        colX += colWidths[i];
    });
    doc.moveTo(50, tableTop + 15).lineTo(520, tableTop + 15).stroke();
    doc.y = tableTop + 20;
    doc.font('Helvetica').fontSize(8);
    data.daily.forEach((day) => {
        const rowY = doc.y;
        colX = 50;
        const dateFormatted = new Date(day.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        doc.text(dateFormatted, colX, rowY, { width: colWidths[0] });
        colX += colWidths[0];
        doc.text(String(day.slotsReported), colX, rowY, { width: colWidths[1] });
        colX += colWidths[1];
        doc.text(String(day.totalRoomsSold), colX, rowY, { width: colWidths[2], align: 'right' });
        colX += colWidths[2];
        doc.text(`${day.avgOccupancy.toFixed(1)}%`, colX, rowY, { width: colWidths[3], align: 'right' });
        colX += colWidths[3];
        doc.text(formatCurrency(day.totalRevenue), colX, rowY, { width: colWidths[4], align: 'right' });
        doc.moveDown(0.8);
    });
    // Period summary
    if (data.summary) {
        doc.moveDown(1);
        doc.moveTo(50, doc.y).lineTo(520, doc.y).stroke();
        doc.moveDown(0.5);
        doc.fontSize(11).font('Helvetica-Bold').text('Summary', 50, doc.y);
        doc.moveDown(0.3);
        const y = doc.y;
        const boxWidth = 120;
        const boxHeight = 50;
        let x = 50;
        const metrics = [
            { label: 'Days Reported', value: String(data.summary.daysReported ?? 0) },
            { label: 'Total Rooms Sold', value: String(data.summary.totalRoomsSold ?? 0) },
            { label: 'Avg Occupancy', value: `${data.summary.avgOccupancy?.toFixed(1)}%` },
            { label: 'Total Revenue', value: formatCurrency(data.summary.totalRevenue ?? 0) },
        ];
        metrics.forEach((m, i) => {
            if (i > 0 && i % 4 === 0) {
                x = 50;
                doc.y += boxHeight + 10;
            }
            drawBox(doc, x, doc.y, boxWidth, boxHeight, m.label, m.value);
            x += boxWidth + 10;
        });
    }
}
function drawBox(doc, x, y, width, height, label, value) {
    doc.rect(x, y, width, height).stroke();
    doc.fontSize(8).font('Helvetica').text(label, x + 5, y + 8, { width: width - 10, align: 'center' });
    doc.fontSize(14).font('Helvetica-Bold').text(value, x + 5, y + 22, { width: width - 10, align: 'center' });
}
