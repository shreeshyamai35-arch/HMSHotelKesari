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
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var prisma_1 = __importDefault(require("../lib/prisma"));
var asyncHandler_1 = require("../lib/asyncHandler");
var auth_1 = require("../middleware/auth");
var roles_1 = require("../constants/roles");
var dates_1 = require("../lib/dates");
var router = (0, express_1.Router)();
router.use(auth_1.authenticate, (0, auth_1.authorize)(roles_1.ROLES.ADMIN, roles_1.ROLES.MANAGEMENT, roles_1.ROLES.REVENUE));
router.get('/', (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, from, to, fromDate, toDate, reports, byEmployee, reports_1, reports_1_1, r, e, byDepartment, _b, _c, e, dept;
    var e_1, _d, e_2, _e;
    var _f;
    return __generator(this, function (_g) {
        switch (_g.label) {
            case 0:
                _a = req.query, from = _a.from, to = _a.to;
                fromDate = from ? (0, dates_1.startOfDay)((0, dates_1.parseDate)(from)) : (0, dates_1.startOfDay)((0, dates_1.addDays)(new Date(), -30));
                toDate = to ? (0, dates_1.endOfDay)((0, dates_1.parseDate)(to)) : (0, dates_1.endOfDay)(new Date());
                return [4 /*yield*/, prisma_1.default.dailyReport.findMany({
                        where: { reportDate: { gte: fromDate, lte: toDate } },
                        include: {
                            gensetChecks: true,
                            waterTankChecks: true,
                            checklistItems: true,
                        },
                    })];
            case 1:
                reports = _g.sent();
                byEmployee = {};
                try {
                    for (reports_1 = __values(reports), reports_1_1 = reports_1.next(); !reports_1_1.done; reports_1_1 = reports_1.next()) {
                        r = reports_1_1.value;
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
                        e = byEmployee[r.employeeId];
                        e.reports += 1;
                        e.gensetChecks += r.gensetChecks.length;
                        e.waterChecks += r.waterTankChecks.length;
                        e.checklistItems += r.checklistItems.length;
                        e.tasks += r.gensetChecks.length + r.waterTankChecks.length + r.checklistItems.length;
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (reports_1_1 && !reports_1_1.done && (_d = reports_1.return)) _d.call(reports_1);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
                byDepartment = {};
                try {
                    for (_b = __values(Object.values(byEmployee)), _c = _b.next(); !_c.done; _c = _b.next()) {
                        e = _c.value;
                        dept = (_f = e.department) !== null && _f !== void 0 ? _f : 'Unassigned';
                        if (!byDepartment[dept])
                            byDepartment[dept] = { department: dept, reports: 0, tasks: 0 };
                        byDepartment[dept].reports += e.reports;
                        byDepartment[dept].tasks += e.tasks;
                    }
                }
                catch (e_2_1) { e_2 = { error: e_2_1 }; }
                finally {
                    try {
                        if (_c && !_c.done && (_e = _b.return)) _e.call(_b);
                    }
                    finally { if (e_2) throw e_2.error; }
                }
                res.json({
                    from: fromDate,
                    to: toDate,
                    employees: Object.values(byEmployee).sort(function (a, b) { return b.tasks - a.tasks; }),
                    departments: Object.values(byDepartment).sort(function (a, b) { return b.tasks - a.tasks; }),
                    totals: {
                        reports: reports.length,
                        tasks: Object.values(byEmployee).reduce(function (s, e) { return s + e.tasks; }, 0),
                    },
                });
                return [2 /*return*/];
        }
    });
}); }));
exports.default = router;
