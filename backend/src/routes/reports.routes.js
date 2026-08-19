"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var zod_1 = require("zod");
var prisma_1 = __importDefault(require("../lib/prisma"));
var asyncHandler_1 = require("../lib/asyncHandler");
var auth_1 = require("../middleware/auth");
var roles_1 = require("../constants/roles");
var dates_1 = require("../lib/dates");
var errors_1 = require("../lib/errors");
var router = (0, express_1.Router)();
router.use(auth_1.authenticate);
var gensetSchema = zod_1.z.object({
    type: zod_1.z.enum(['MORNING', 'EVENING']),
    status: zod_1.z.enum(['WORKING', 'NOT_WORKING']),
    fuelLevel: zod_1.z.enum(['FULL', 'MEDIUM', 'LOW']),
    remarks: zod_1.z.string().optional().nullable(),
    employeeName: zod_1.z.string().optional(),
});
var waterSchema = zod_1.z.object({
    slot: zod_1.z.enum(['SLOT_0700', 'SLOT_1200', 'SLOT_1600', 'SLOT_2100']),
    status: zod_1.z.enum(['FULL', 'MEDIUM', 'LOW']),
    remarks: zod_1.z.string().optional().nullable(),
    employeeName: zod_1.z.string().optional(),
});
var checklistSchema = zod_1.z.object({
    key: zod_1.z.string().min(1),
    label: zod_1.z.string().min(1),
    status: zod_1.z.string().min(1),
    remarks: zod_1.z.string().optional().nullable(),
});
var createSchema = zod_1.z.object({
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
var reportInclude = {
    gensetChecks: true,
    waterTankChecks: true,
    checklistItems: true,
    complaints: true,
    maintenance: true,
    incidents: true,
    pdfReports: true,
};
// Create a daily operations report
router.post('/', (0, auth_1.authorize)(roles_1.ROLES.ADMIN, roles_1.ROLES.FRONT_OFFICE), (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var data, user, reportDate, dbUser, department, employeeName, report;
    var _a, _b, _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                data = createSchema.parse(req.body);
                user = req.user;
                reportDate = (0, dates_1.startOfDay)((0, dates_1.parseDate)(data.reportDate));
                return [4 /*yield*/, prisma_1.default.user.findUnique({ where: { id: user.sub } })];
            case 1:
                dbUser = _d.sent();
                department = (_a = dbUser === null || dbUser === void 0 ? void 0 : dbUser.department) !== null && _a !== void 0 ? _a : null;
                employeeName = (_b = dbUser === null || dbUser === void 0 ? void 0 : dbUser.name) !== null && _b !== void 0 ? _b : user.name;
                return [4 /*yield*/, prisma_1.default.dailyReport.create({
                        data: {
                            reportDate: reportDate,
                            employeeId: user.sub,
                            employeeName: employeeName,
                            department: department,
                            remarks: (_c = data.remarks) !== null && _c !== void 0 ? _c : null,
                            gensetChecks: {
                                create: data.gensetChecks.map(function (g) {
                                    var _a, _b;
                                    return ({
                                        type: g.type,
                                        status: g.status,
                                        fuelLevel: g.fuelLevel,
                                        remarks: (_a = g.remarks) !== null && _a !== void 0 ? _a : null,
                                        employeeName: (_b = g.employeeName) !== null && _b !== void 0 ? _b : employeeName,
                                    });
                                }),
                            },
                            waterTankChecks: {
                                create: data.waterTankChecks.map(function (w) {
                                    var _a, _b;
                                    return ({
                                        slot: w.slot,
                                        status: w.status,
                                        remarks: (_a = w.remarks) !== null && _a !== void 0 ? _a : null,
                                        employeeName: (_b = w.employeeName) !== null && _b !== void 0 ? _b : employeeName,
                                    });
                                }),
                            },
                            checklistItems: {
                                create: data.checklistItems.map(function (c) {
                                    var _a;
                                    return ({
                                        key: c.key,
                                        label: c.label,
                                        status: c.status,
                                        remarks: (_a = c.remarks) !== null && _a !== void 0 ? _a : null,
                                    });
                                }),
                            },
                            complaints: {
                                create: data.complaints.map(function (c) { var _a; return ({ details: c.details, guestName: (_a = c.guestName) !== null && _a !== void 0 ? _a : null }); }),
                            },
                            maintenance: {
                                create: data.maintenance.map(function (m) { var _a; return ({ details: m.details, priority: (_a = m.priority) !== null && _a !== void 0 ? _a : 'MEDIUM' }); }),
                            },
                            incidents: {
                                create: data.incidents.map(function (i) { return ({ type: i.type, details: i.details }); }),
                            },
                        },
                        include: reportInclude,
                    })];
            case 2:
                report = _d.sent();
                res.status(201).json(report);
                return [2 /*return*/];
        }
    });
}); }));
// List reports (filterable). Front office sees only their own.
router.get('/', (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, from, to, employeeId, where, reports;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = req.query, from = _a.from, to = _a.to, employeeId = _a.employeeId;
                where = {};
                if (req.user.role === roles_1.ROLES.FRONT_OFFICE) {
                    where.employeeId = req.user.sub;
                }
                else if (employeeId) {
                    where.employeeId = employeeId;
                }
                if (from || to) {
                    where.reportDate = __assign(__assign({}, (from ? { gte: (0, dates_1.startOfDay)((0, dates_1.parseDate)(from)) } : {})), (to ? { lte: (0, dates_1.endOfDay)((0, dates_1.parseDate)(to)) } : {}));
                }
                return [4 /*yield*/, prisma_1.default.dailyReport.findMany({
                        where: where,
                        include: reportInclude,
                        orderBy: { reportDate: 'desc' },
                        take: 200,
                    })];
            case 1:
                reports = _b.sent();
                res.json(reports);
                return [2 /*return*/];
        }
    });
}); }));
router.get('/:id', (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var report;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma_1.default.dailyReport.findUnique({
                    where: { id: req.params.id },
                    include: reportInclude,
                })];
            case 1:
                report = _a.sent();
                if (!report)
                    throw (0, errors_1.notFound)('Report not found');
                if (req.user.role === roles_1.ROLES.FRONT_OFFICE && report.employeeId !== req.user.sub) {
                    throw (0, errors_1.notFound)('Report not found');
                }
                res.json(report);
                return [2 /*return*/];
        }
    });
}); }));
exports.default = router;
