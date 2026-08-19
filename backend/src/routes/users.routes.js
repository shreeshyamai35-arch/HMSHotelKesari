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
var password_1 = require("../lib/password");
var roles_1 = require("../constants/roles");
var errors_1 = require("../lib/errors");
var router = (0, express_1.Router)();
router.use(auth_1.authenticate, (0, auth_1.authorize)(roles_1.ROLES.ADMIN));
var publicUser = {
    id: true,
    name: true,
    email: true,
    role: true,
    department: true,
    active: true,
    createdAt: true,
};
router.get('/', (0, asyncHandler_1.asyncHandler)(function (_req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var users;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma_1.default.user.findMany({
                    select: publicUser,
                    orderBy: { createdAt: 'desc' },
                })];
            case 1:
                users = _a.sent();
                res.json(users);
                return [2 /*return*/];
        }
    });
}); }));
var createSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    role: zod_1.z.enum([roles_1.ROLES.ADMIN, roles_1.ROLES.FRONT_OFFICE, roles_1.ROLES.REVENUE, roles_1.ROLES.MANAGEMENT]),
    department: zod_1.z.string().optional().nullable(),
});
router.post('/', (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var data, exists, user, _a, _b;
    var _c, _d;
    var _e;
    return __generator(this, function (_f) {
        switch (_f.label) {
            case 0:
                data = createSchema.parse(req.body);
                return [4 /*yield*/, prisma_1.default.user.findUnique({ where: { email: data.email.toLowerCase() } })];
            case 1:
                exists = _f.sent();
                if (exists)
                    throw (0, errors_1.badRequest)('A user with this email already exists');
                _b = (_a = prisma_1.default.user).create;
                _c = {};
                _d = {
                    name: data.name,
                    email: data.email.toLowerCase()
                };
                return [4 /*yield*/, (0, password_1.hashPassword)(data.password)];
            case 2: return [4 /*yield*/, _b.apply(_a, [(_c.data = (_d.passwordHash = _f.sent(),
                        _d.role = data.role,
                        _d.department = (_e = data.department) !== null && _e !== void 0 ? _e : null,
                        _d),
                        _c.select = publicUser,
                        _c)])];
            case 3:
                user = _f.sent();
                res.status(201).json(user);
                return [2 /*return*/];
        }
    });
}); }));
var updateSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    role: zod_1.z.enum([roles_1.ROLES.ADMIN, roles_1.ROLES.FRONT_OFFICE, roles_1.ROLES.REVENUE, roles_1.ROLES.MANAGEMENT]).optional(),
    department: zod_1.z.string().optional().nullable(),
    active: zod_1.z.boolean().optional(),
});
router.patch('/:id', (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var data, existing, user;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                data = updateSchema.parse(req.body);
                return [4 /*yield*/, prisma_1.default.user.findUnique({ where: { id: req.params.id } })];
            case 1:
                existing = _a.sent();
                if (!existing)
                    throw (0, errors_1.notFound)('User not found');
                return [4 /*yield*/, prisma_1.default.user.update({
                        where: { id: req.params.id },
                        data: data,
                        select: publicUser,
                    })];
            case 2:
                user = _a.sent();
                res.json(user);
                return [2 /*return*/];
        }
    });
}); }));
var resetSchema = zod_1.z.object({ newPassword: zod_1.z.string().min(6) });
router.post('/:id/reset-password', (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var newPassword, existing, _a, _b;
    var _c, _d;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                newPassword = resetSchema.parse(req.body).newPassword;
                return [4 /*yield*/, prisma_1.default.user.findUnique({ where: { id: req.params.id } })];
            case 1:
                existing = _e.sent();
                if (!existing)
                    throw (0, errors_1.notFound)('User not found');
                _b = (_a = prisma_1.default.user).update;
                _c = {
                    where: { id: req.params.id }
                };
                _d = {};
                return [4 /*yield*/, (0, password_1.hashPassword)(newPassword)];
            case 2: return [4 /*yield*/, _b.apply(_a, [(_c.data = (_d.passwordHash = _e.sent(), _d),
                        _c)])];
            case 3:
                _e.sent();
                res.json({ success: true });
                return [2 /*return*/];
        }
    });
}); }));
router.delete('/:id', (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var existing;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma_1.default.user.findUnique({ where: { id: req.params.id } })];
            case 1:
                existing = _a.sent();
                if (!existing)
                    throw (0, errors_1.notFound)('User not found');
                // Soft-deactivate rather than hard delete to preserve report history.
                return [4 /*yield*/, prisma_1.default.user.update({ where: { id: req.params.id }, data: { active: false } })];
            case 2:
                // Soft-deactivate rather than hard delete to preserve report history.
                _a.sent();
                res.json({ success: true });
                return [2 /*return*/];
        }
    });
}); }));
router.get('/roles', function (_req, res) { return res.json(roles_1.ALL_ROLES); });
exports.default = router;
