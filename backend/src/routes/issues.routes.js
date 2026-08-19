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
var zod_1 = require("zod");
var prisma_1 = __importDefault(require("../lib/prisma"));
var asyncHandler_1 = require("../lib/asyncHandler");
var auth_1 = require("../middleware/auth");
var errors_1 = require("../lib/errors");
var router = (0, express_1.Router)();
router.use(auth_1.authenticate);
// ─── Complaints ───────────────────────────────────────────
router.get('/complaints', (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var status, complaints;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                status = req.query.status;
                return [4 /*yield*/, prisma_1.default.complaint.findMany({
                        where: status ? { status: status } : {},
                        orderBy: { createdAt: 'desc' },
                        take: 200,
                    })];
            case 1:
                complaints = _a.sent();
                res.json(complaints);
                return [2 /*return*/];
        }
    });
}); }));
var complaintCreateSchema = zod_1.z.object({
    details: zod_1.z.string().min(1),
    guestName: zod_1.z.string().optional().nullable(),
});
router.post('/complaints', (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var data, complaint;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                data = complaintCreateSchema.parse(req.body);
                return [4 /*yield*/, prisma_1.default.complaint.create({
                        data: { details: data.details, guestName: (_a = data.guestName) !== null && _a !== void 0 ? _a : null },
                    })];
            case 1:
                complaint = _b.sent();
                res.status(201).json(complaint);
                return [2 /*return*/];
        }
    });
}); }));
var statusSchema = zod_1.z.object({ status: zod_1.z.enum(['OPEN', 'CLOSED']) });
router.patch('/complaints/:id', (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var status, existing, complaint;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                status = statusSchema.parse(req.body).status;
                return [4 /*yield*/, prisma_1.default.complaint.findUnique({ where: { id: req.params.id } })];
            case 1:
                existing = _a.sent();
                if (!existing)
                    throw (0, errors_1.notFound)('Complaint not found');
                return [4 /*yield*/, prisma_1.default.complaint.update({
                        where: { id: req.params.id },
                        data: { status: status, resolvedAt: status === 'CLOSED' ? new Date() : null },
                    })];
            case 2:
                complaint = _a.sent();
                res.json(complaint);
                return [2 /*return*/];
        }
    });
}); }));
// ─── Maintenance ──────────────────────────────────────────
router.get('/maintenance', (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var status, items;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                status = req.query.status;
                return [4 /*yield*/, prisma_1.default.maintenanceIssue.findMany({
                        where: status ? { status: status } : {},
                        orderBy: { createdAt: 'desc' },
                        take: 200,
                    })];
            case 1:
                items = _a.sent();
                res.json(items);
                return [2 /*return*/];
        }
    });
}); }));
var maintenanceCreateSchema = zod_1.z.object({
    details: zod_1.z.string().min(1),
    priority: zod_1.z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
});
router.post('/maintenance', (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var data, item;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                data = maintenanceCreateSchema.parse(req.body);
                return [4 /*yield*/, prisma_1.default.maintenanceIssue.create({
                        data: { details: data.details, priority: (_a = data.priority) !== null && _a !== void 0 ? _a : 'MEDIUM' },
                    })];
            case 1:
                item = _b.sent();
                res.status(201).json(item);
                return [2 /*return*/];
        }
    });
}); }));
router.patch('/maintenance/:id', (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var status, existing, item;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                status = statusSchema.parse(req.body).status;
                return [4 /*yield*/, prisma_1.default.maintenanceIssue.findUnique({ where: { id: req.params.id } })];
            case 1:
                existing = _a.sent();
                if (!existing)
                    throw (0, errors_1.notFound)('Maintenance issue not found');
                return [4 /*yield*/, prisma_1.default.maintenanceIssue.update({
                        where: { id: req.params.id },
                        data: { status: status, resolvedAt: status === 'CLOSED' ? new Date() : null },
                    })];
            case 2:
                item = _a.sent();
                res.json(item);
                return [2 /*return*/];
        }
    });
}); }));
exports.default = router;
