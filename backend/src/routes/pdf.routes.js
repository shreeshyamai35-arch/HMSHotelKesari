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
var express_1 = require("express");
var fs_1 = __importDefault(require("fs"));
var prisma_1 = __importDefault(require("../lib/prisma"));
var asyncHandler_1 = require("../lib/asyncHandler");
var auth_1 = require("../middleware/auth");
var roles_1 = require("../constants/roles");
var pdf_service_1 = require("../services/pdf.service");
var errors_1 = require("../lib/errors");
var router = (0, express_1.Router)();
router.use(auth_1.authenticate);
var reportInclude = {
    gensetChecks: true,
    waterTankChecks: true,
    checklistItems: true,
    complaints: true,
    maintenance: true,
    incidents: true,
};
// Generate (or regenerate) a PDF for a given report
router.post('/reports/:reportId/generate', (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var report, _a, fileName, filePath, pdfRecord;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, prisma_1.default.dailyReport.findUnique({
                    where: { id: req.params.reportId },
                    include: reportInclude,
                })];
            case 1:
                report = _b.sent();
                if (!report)
                    throw (0, errors_1.notFound)('Report not found');
                if (req.user.role === roles_1.ROLES.FRONT_OFFICE && report.employeeId !== req.user.sub) {
                    throw (0, errors_1.notFound)('Report not found');
                }
                return [4 /*yield*/, (0, pdf_service_1.generateReportPdf)(report)];
            case 2:
                _a = _b.sent(), fileName = _a.fileName, filePath = _a.filePath;
                return [4 /*yield*/, prisma_1.default.pdfReport.create({
                        data: { reportId: report.id, fileName: fileName, filePath: filePath },
                    })];
            case 3:
                pdfRecord = _b.sent();
                res.status(201).json(pdfRecord);
                return [2 /*return*/];
        }
    });
}); }));
// List generated PDFs for a report
router.get('/reports/:reportId', (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var pdfs;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma_1.default.pdfReport.findMany({
                    where: { reportId: req.params.reportId },
                    orderBy: { generatedAt: 'desc' },
                })];
            case 1:
                pdfs = _a.sent();
                res.json(pdfs);
                return [2 /*return*/];
        }
    });
}); }));
// Download a generated PDF (generates on the fly if file is missing)
router.get('/:pdfId/download', (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var pdf, report, filePath;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma_1.default.pdfReport.findUnique({ where: { id: req.params.pdfId } })];
            case 1:
                pdf = _a.sent();
                if (!pdf)
                    throw (0, errors_1.notFound)('PDF not found');
                if (!!fs_1.default.existsSync(pdf.filePath)) return [3 /*break*/, 5];
                return [4 /*yield*/, prisma_1.default.dailyReport.findUnique({
                        where: { id: pdf.reportId },
                        include: reportInclude,
                    })];
            case 2:
                report = _a.sent();
                if (!report)
                    throw (0, errors_1.notFound)('Source report not found');
                return [4 /*yield*/, (0, pdf_service_1.generateReportPdf)(report)];
            case 3:
                filePath = (_a.sent()).filePath;
                return [4 /*yield*/, prisma_1.default.pdfReport.update({ where: { id: pdf.id }, data: { filePath: filePath } })];
            case 4:
                _a.sent();
                return [2 /*return*/, res.download(filePath, pdf.fileName)];
            case 5:
                res.download(pdf.filePath, pdf.fileName);
                return [2 /*return*/];
        }
    });
}); }));
exports.default = router;
