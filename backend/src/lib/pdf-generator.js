"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOccupancyPDF = generateOccupancyPDF;
var pdfkit_1 = __importDefault(require("pdfkit"));
function formatCurrency(amount) {
    return "\u20B9".concat(amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
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
function generateOccupancyPDF(report) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    var doc = new pdfkit_1.default({ size: 'A4', margin: 50 });
                    var chunks = [];
                    doc.on('data', function (chunk) { return chunks.push(chunk); });
                    doc.on('end', function () { return resolve(Buffer.concat(chunks)); });
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
                    doc.fontSize(8).font('Helvetica').text("Generated on ".concat(formatDateTime(new Date())), 50, doc.page.height - 50, { align: 'center' });
                    doc.end();
                })];
        });
    });
}
function renderSingleSlot(doc, data) {
    var _a, _b;
    var y = doc.y;
    // Summary boxes
    doc.fontSize(10).font('Helvetica-Bold');
    var boxWidth = 120;
    var boxHeight = 50;
    var startX = 50;
    var x = startX;
    var metrics = [
        { label: 'Total Rooms', value: data.totalRooms },
        { label: 'Working', value: data.workingRooms },
        { label: 'Out of Order', value: data.outOfOrder },
        { label: 'Rooms Sold', value: data.roomsSold },
    ];
    metrics.forEach(function (m, i) {
        var _a;
        if (i > 0 && i % 4 === 0) {
            x = startX;
            doc.y += boxHeight + 10;
        }
        drawBox(doc, x, doc.y, boxWidth, boxHeight, m.label, String((_a = m.value) !== null && _a !== void 0 ? _a : 0));
        x += boxWidth + 10;
    });
    doc.y += boxHeight + 10;
    x = startX;
    drawBox(doc, x, doc.y, boxWidth, boxHeight, 'Occupancy', "".concat((_a = data.occupancy) === null || _a === void 0 ? void 0 : _a.toFixed(1), "%"));
    x += boxWidth + 10;
    drawBox(doc, x, doc.y, boxWidth, boxHeight, 'Revenue', formatCurrency((_b = data.revenue) !== null && _b !== void 0 ? _b : 0));
    doc.y += boxHeight + 20;
    // Room sales table
    if (data.sales && data.sales.length > 0) {
        doc.fontSize(12).font('Helvetica-Bold').text('Room Sales', 50, doc.y);
        doc.moveDown(0.5);
        var tableTop_1 = doc.y;
        var colWidths_1 = [60, 80, 100, 140, 90];
        var headers = ['Room', 'Type', 'Source', 'Detail', 'Price'];
        // Table header
        doc.fontSize(9).font('Helvetica-Bold');
        var colX_1 = 50;
        headers.forEach(function (h, i) {
            doc.text(h, colX_1, tableTop_1, { width: colWidths_1[i], align: i === 4 ? 'right' : 'left' });
            colX_1 += colWidths_1[i];
        });
        doc.moveTo(50, tableTop_1 + 15).lineTo(520, tableTop_1 + 15).stroke();
        doc.y = tableTop_1 + 20;
        // Table rows
        doc.font('Helvetica').fontSize(8);
        data.sales.forEach(function (sale) {
            var _a;
            var rowY = doc.y;
            colX_1 = 50;
            doc.text(sale.roomNumber, colX_1, rowY, { width: colWidths_1[0] });
            colX_1 += colWidths_1[0];
            doc.text(sale.roomType, colX_1, rowY, { width: colWidths_1[1] });
            colX_1 += colWidths_1[1];
            doc.text(sale.source, colX_1, rowY, { width: colWidths_1[2] });
            colX_1 += colWidths_1[2];
            doc.text((_a = sale.sourceDetail) !== null && _a !== void 0 ? _a : '—', colX_1, rowY, { width: colWidths_1[3] });
            colX_1 += colWidths_1[3];
            doc.text(formatCurrency(sale.priceSold), colX_1, rowY, { width: colWidths_1[4], align: 'right' });
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
        doc.fontSize(8).font('Helvetica').text("Submitted by ".concat(data.submittedBy, " on ").concat(formatDateTime(data.submittedAt)), 50, doc.y, { align: 'left' });
    }
}
function renderDailyReport(doc, data) {
    var _a, _b;
    if (!data.slots)
        return;
    data.slots.forEach(function (slot, index) {
        if (index > 0) {
            doc.moveDown(1.5);
            doc.moveTo(50, doc.y).lineTo(520, doc.y).stroke();
            doc.moveDown(1);
        }
        doc.fontSize(12).font('Helvetica-Bold').text("".concat(slot.slotLabel, " Report"), 50, doc.y);
        doc.moveDown(0.5);
        // Slot summary
        doc.fontSize(9).font('Helvetica');
        var metrics = [
            "Total: ".concat(slot.totalRooms),
            "Working: ".concat(slot.workingRooms),
            "Out of Order: ".concat(slot.outOfOrder),
            "Sold: ".concat(slot.roomsSold),
            "Occupancy: ".concat(slot.occupancy.toFixed(1), "%"),
            "Revenue: ".concat(formatCurrency(slot.revenue)),
        ];
        doc.text(metrics.join('  •  '), 50, doc.y);
        doc.moveDown(0.5);
        if (slot.sales.length > 0) {
            var tableTop_2 = doc.y;
            var colWidths_2 = [60, 80, 100, 140, 90];
            var headers = ['Room', 'Type', 'Source', 'Detail', 'Price'];
            doc.fontSize(8).font('Helvetica-Bold');
            var colX_2 = 50;
            headers.forEach(function (h, i) {
                doc.text(h, colX_2, tableTop_2, { width: colWidths_2[i], align: i === 4 ? 'right' : 'left' });
                colX_2 += colWidths_2[i];
            });
            doc.moveTo(50, tableTop_2 + 12).lineTo(520, tableTop_2 + 12).stroke();
            doc.y = tableTop_2 + 16;
            doc.font('Helvetica').fontSize(7);
            slot.sales.forEach(function (sale) {
                var _a;
                var rowY = doc.y;
                colX_2 = 50;
                doc.text(sale.roomNumber, colX_2, rowY, { width: colWidths_2[0] });
                colX_2 += colWidths_2[0];
                doc.text(sale.roomType, colX_2, rowY, { width: colWidths_2[1] });
                colX_2 += colWidths_2[1];
                doc.text(sale.source, colX_2, rowY, { width: colWidths_2[2] });
                colX_2 += colWidths_2[2];
                doc.text((_a = sale.sourceDetail) !== null && _a !== void 0 ? _a : '—', colX_2, rowY, { width: colWidths_2[3] });
                colX_2 += colWidths_2[3];
                doc.text(formatCurrency(sale.priceSold), colX_2, rowY, { width: colWidths_2[4], align: 'right' });
                doc.moveDown(0.7);
            });
        }
        if (slot.notes) {
            doc.moveDown(0.3);
            doc.fontSize(8).font('Helvetica').text("Notes: ".concat(slot.notes), 50, doc.y, { width: 495 });
        }
        doc.fontSize(7).font('Helvetica').text("Submitted by ".concat(slot.submittedBy, " on ").concat(formatDateTime(slot.submittedAt)), 50, doc.y + 5);
    });
    // Daily summary
    if (data.summary) {
        doc.moveDown(1.5);
        doc.moveTo(50, doc.y).lineTo(520, doc.y).stroke();
        doc.moveDown(0.5);
        doc.fontSize(11).font('Helvetica-Bold').text('Daily Summary', 50, doc.y);
        doc.moveDown(0.3);
        doc.fontSize(9).font('Helvetica');
        var summary = [
            "Slots Reported: ".concat(data.summary.slotsReported),
            "Total Revenue: ".concat(formatCurrency((_a = data.summary.totalRevenue) !== null && _a !== void 0 ? _a : 0)),
            "Avg Occupancy: ".concat((_b = data.summary.avgOccupancy) === null || _b === void 0 ? void 0 : _b.toFixed(1), "%"),
        ];
        doc.text(summary.join('  •  '), 50, doc.y);
    }
}
function renderPeriodReport(doc, data) {
    var _a, _b, _c, _d;
    if (!data.daily)
        return;
    doc.fontSize(11).font('Helvetica-Bold').text('Daily Breakdown', 50, doc.y);
    doc.moveDown(0.5);
    var tableTop = doc.y;
    var colWidths = [100, 80, 100, 90, 100];
    var headers = ['Date', 'Slots', 'Rooms Sold', 'Occupancy', 'Revenue'];
    doc.fontSize(9).font('Helvetica-Bold');
    var colX = 50;
    headers.forEach(function (h, i) {
        doc.text(h, colX, tableTop, { width: colWidths[i], align: i >= 2 ? 'right' : 'left' });
        colX += colWidths[i];
    });
    doc.moveTo(50, tableTop + 15).lineTo(520, tableTop + 15).stroke();
    doc.y = tableTop + 20;
    doc.font('Helvetica').fontSize(8);
    data.daily.forEach(function (day) {
        var rowY = doc.y;
        colX = 50;
        var dateFormatted = new Date(day.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        doc.text(dateFormatted, colX, rowY, { width: colWidths[0] });
        colX += colWidths[0];
        doc.text(String(day.slotsReported), colX, rowY, { width: colWidths[1] });
        colX += colWidths[1];
        doc.text(String(day.totalRoomsSold), colX, rowY, { width: colWidths[2], align: 'right' });
        colX += colWidths[2];
        doc.text("".concat(day.avgOccupancy.toFixed(1), "%"), colX, rowY, { width: colWidths[3], align: 'right' });
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
        var y = doc.y;
        var boxWidth_1 = 120;
        var boxHeight_1 = 50;
        var x_1 = 50;
        var metrics = [
            { label: 'Days Reported', value: String((_a = data.summary.daysReported) !== null && _a !== void 0 ? _a : 0) },
            { label: 'Total Rooms Sold', value: String((_b = data.summary.totalRoomsSold) !== null && _b !== void 0 ? _b : 0) },
            { label: 'Avg Occupancy', value: "".concat((_c = data.summary.avgOccupancy) === null || _c === void 0 ? void 0 : _c.toFixed(1), "%") },
            { label: 'Total Revenue', value: formatCurrency((_d = data.summary.totalRevenue) !== null && _d !== void 0 ? _d : 0) },
        ];
        metrics.forEach(function (m, i) {
            if (i > 0 && i % 4 === 0) {
                x_1 = 50;
                doc.y += boxHeight_1 + 10;
            }
            drawBox(doc, x_1, doc.y, boxWidth_1, boxHeight_1, m.label, m.value);
            x_1 += boxWidth_1 + 10;
        });
    }
}
function drawBox(doc, x, y, width, height, label, value) {
    doc.rect(x, y, width, height).stroke();
    doc.fontSize(8).font('Helvetica').text(label, x + 5, y + 8, { width: width - 10, align: 'center' });
    doc.fontSize(14).font('Helvetica-Bold').text(value, x + 5, y + 22, { width: width - 10, align: 'center' });
}
