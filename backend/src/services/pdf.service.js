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
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
exports.STORAGE_DIR = void 0;
exports.generateReportPdf = generateReportPdf;
var path_1 = __importDefault(require("path"));
var fs_1 = __importDefault(require("fs"));
// eslint-disable-next-line @typescript-eslint/no-var-requires
var PdfPrinter = require('pdfmake');
// eslint-disable-next-line @typescript-eslint/no-var-requires
var vfs = require('pdfmake/build/vfs_fonts.js');
// vfs_fonts exports the font files (base64) keyed by filename. Handle the
// few shapes pdfmake has used across versions.
var vfsFiles = (_c = (_b = (_a = vfs === null || vfs === void 0 ? void 0 : vfs.pdfMake) === null || _a === void 0 ? void 0 : _a.vfs) !== null && _b !== void 0 ? _b : vfs === null || vfs === void 0 ? void 0 : vfs.vfs) !== null && _c !== void 0 ? _c : vfs;
function fontBuffer(name) {
    var data = vfsFiles[name];
    if (!data)
        throw new Error("Embedded font not found: ".concat(name));
    return Buffer.from(data, 'base64');
}
var printer = new PdfPrinter({
    Roboto: {
        normal: fontBuffer('Roboto-Regular.ttf'),
        bold: fontBuffer('Roboto-Medium.ttf'),
        italics: fontBuffer('Roboto-Italic.ttf'),
        bolditalics: fontBuffer('Roboto-MediumItalic.ttf'),
    },
});
exports.STORAGE_DIR = path_1.default.resolve(process.cwd(), 'storage', 'pdf');
function ensureStorageDir() {
    if (!fs_1.default.existsSync(exports.STORAGE_DIR)) {
        fs_1.default.mkdirSync(exports.STORAGE_DIR, { recursive: true });
    }
}
var NAVY = '#131b2e';
var GOLD = '#7c580f';
var SLATE = '#45464d';
var SLOT_LABELS = {
    SLOT_0700: '7:00 AM',
    SLOT_1200: '12:00 PM',
    SLOT_1600: '4:00 PM',
    SLOT_2100: '9:00 PM',
};
function fmtDate(d) {
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtDateTime(d) {
    return new Date(d).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}
function sectionHeader(text) {
    return { text: text, style: 'sectionHeader', margin: [0, 14, 0, 6] };
}
function buildDocDefinition(report) {
    var content = [];
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
                body: __spreadArray([
                    [
                        { text: 'Type', style: 'th' },
                        { text: 'Status', style: 'th' },
                        { text: 'Fuel Level', style: 'th' },
                        { text: 'Remarks', style: 'th' },
                    ]
                ], __read(report.gensetChecks.map(function (g) {
                    var _a;
                    return [
                        g.type,
                        g.status.replace('_', ' '),
                        g.fuelLevel,
                        (_a = g.remarks) !== null && _a !== void 0 ? _a : '-',
                    ];
                })), false),
            },
            layout: 'lightHorizontalLines',
        });
    }
    else {
        content.push({ text: 'No genset checks recorded.', style: 'empty' });
    }
    // Water tank
    content.push(sectionHeader('Water Tank Checks'));
    if (report.waterTankChecks.length) {
        content.push({
            table: {
                widths: ['*', '*', '*'],
                body: __spreadArray([
                    [
                        { text: 'Slot', style: 'th' },
                        { text: 'Status', style: 'th' },
                        { text: 'Remarks', style: 'th' },
                    ]
                ], __read(report.waterTankChecks.map(function (w) { var _a, _b; return [(_a = SLOT_LABELS[w.slot]) !== null && _a !== void 0 ? _a : w.slot, w.status, (_b = w.remarks) !== null && _b !== void 0 ? _b : '-']; })), false),
            },
            layout: 'lightHorizontalLines',
        });
    }
    else {
        content.push({ text: 'No water tank checks recorded.', style: 'empty' });
    }
    // Utility checklist
    content.push(sectionHeader('Utility & Operations Checklist'));
    if (report.checklistItems.length) {
        content.push({
            table: {
                widths: ['*', 'auto', '*'],
                body: __spreadArray([
                    [
                        { text: 'Item', style: 'th' },
                        { text: 'Status', style: 'th' },
                        { text: 'Remarks', style: 'th' },
                    ]
                ], __read(report.checklistItems.map(function (c) { var _a; return [c.label, c.status, (_a = c.remarks) !== null && _a !== void 0 ? _a : '-']; })), false),
            },
            layout: 'lightHorizontalLines',
        });
    }
    else {
        content.push({ text: 'No checklist items recorded.', style: 'empty' });
    }
    // Issues
    content.push(sectionHeader('Guest Complaints'));
    content.push(report.complaints.length
        ? { ul: report.complaints.map(function (c) { return "".concat(c.guestName ? c.guestName + ': ' : '').concat(c.details, " (").concat(c.status, ")"); }) }
        : { text: 'None reported.', style: 'empty' });
    content.push(sectionHeader('Maintenance Issues'));
    content.push(report.maintenance.length
        ? { ul: report.maintenance.map(function (m) { return "[".concat(m.priority, "] ").concat(m.details, " (").concat(m.status, ")"); }) }
        : { text: 'None reported.', style: 'empty' });
    content.push(sectionHeader('Incidents / Lost & Found'));
    content.push(report.incidents.length
        ? { ul: report.incidents.map(function (i) { return "[".concat(i.type.replace('_', ' '), "] ").concat(i.details); }) }
        : { text: 'None reported.', style: 'empty' });
    if (report.remarks) {
        content.push(sectionHeader('General Remarks'));
        content.push({ text: report.remarks });
    }
    return {
        content: content,
        defaultStyle: { font: 'Roboto', fontSize: 10, color: '#0b1c30' },
        styles: {
            brand: { fontSize: 20, bold: true, color: NAVY },
            docTitle: { fontSize: 12, bold: true, color: GOLD, margin: [0, 6, 0, 0] },
            sectionHeader: { fontSize: 12, bold: true, color: NAVY },
            meta: { fontSize: 9, color: SLATE, margin: [0, 2, 0, 2] },
            th: { bold: true, fillColor: '#eff4ff', color: NAVY, fontSize: 9 },
            empty: { italics: true, color: SLATE },
        },
        footer: function (currentPage, pageCount) { return ({
            text: "Hotel Kesari \u2014 Operations Report  |  Page ".concat(currentPage, " of ").concat(pageCount),
            alignment: 'center',
            fontSize: 8,
            color: SLATE,
            margin: [0, 10, 0, 0],
        }); },
        pageMargins: [40, 40, 40, 50],
    };
}
function generateReportPdf(report) {
    return __awaiter(this, void 0, void 0, function () {
        var fileName, filePath, docDefinition, pdfDoc;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    ensureStorageDir();
                    fileName = "report-".concat(report.id, "-").concat(Date.now(), ".pdf");
                    filePath = path_1.default.join(exports.STORAGE_DIR, fileName);
                    docDefinition = buildDocDefinition(report);
                    pdfDoc = printer.createPdfKitDocument(docDefinition);
                    return [4 /*yield*/, new Promise(function (resolve, reject) {
                            var stream = fs_1.default.createWriteStream(filePath);
                            pdfDoc.pipe(stream);
                            pdfDoc.on('error', reject);
                            stream.on('error', reject);
                            stream.on('finish', function () { return resolve(); });
                            pdfDoc.end();
                        })];
                case 1:
                    _a.sent();
                    return [2 /*return*/, { fileName: fileName, filePath: filePath }];
            }
        });
    });
}
