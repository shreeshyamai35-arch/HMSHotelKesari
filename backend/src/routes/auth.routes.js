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
var express_rate_limit_1 = __importDefault(require("express-rate-limit"));
var prisma_1 = __importDefault(require("../lib/prisma"));
var asyncHandler_1 = require("../lib/asyncHandler");
var jwt_1 = require("../lib/jwt");
var password_1 = require("../lib/password");
var auth_1 = require("../middleware/auth");
var errors_1 = require("../lib/errors");
var router = (0, express_1.Router)();
var loginLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many login attempts from this IP, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
});
var loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
});
router.post('/login', loginLimiter, (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, email, password, user, ok, token;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = loginSchema.parse(req.body), email = _a.email, password = _a.password;
                return [4 /*yield*/, prisma_1.default.user.findUnique({ where: { email: email.toLowerCase() } })];
            case 1:
                user = _b.sent();
                if (!user || !user.active)
                    throw (0, errors_1.unauthorized)('Invalid credentials');
                return [4 /*yield*/, (0, password_1.verifyPassword)(password, user.passwordHash)];
            case 2:
                ok = _b.sent();
                if (!ok)
                    throw (0, errors_1.unauthorized)('Invalid credentials');
                token = (0, jwt_1.signToken)({ sub: user.id, email: user.email, role: user.role, name: user.name });
                res.json({
                    token: token,
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        department: user.department,
                    },
                });
                return [2 /*return*/];
        }
    });
}); }));
router.get('/me', auth_1.authenticate, (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var user;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma_1.default.user.findUnique({ where: { id: req.user.sub } })];
            case 1:
                user = _a.sent();
                if (!user)
                    throw (0, errors_1.unauthorized)();
                res.json({
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    department: user.department,
                });
                return [2 /*return*/];
        }
    });
}); }));
var changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1),
    newPassword: zod_1.z.string().min(6),
});
router.post('/change-password', auth_1.authenticate, (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, currentPassword, newPassword, user, ok, _b, _c;
    var _d, _e;
    return __generator(this, function (_f) {
        switch (_f.label) {
            case 0:
                _a = changePasswordSchema.parse(req.body), currentPassword = _a.currentPassword, newPassword = _a.newPassword;
                return [4 /*yield*/, prisma_1.default.user.findUnique({ where: { id: req.user.sub } })];
            case 1:
                user = _f.sent();
                if (!user)
                    throw (0, errors_1.unauthorized)();
                return [4 /*yield*/, (0, password_1.verifyPassword)(currentPassword, user.passwordHash)];
            case 2:
                ok = _f.sent();
                if (!ok)
                    throw (0, errors_1.badRequest)('Current password is incorrect');
                _c = (_b = prisma_1.default.user).update;
                _d = {
                    where: { id: user.id }
                };
                _e = {};
                return [4 /*yield*/, (0, password_1.hashPassword)(newPassword)];
            case 3: return [4 /*yield*/, _c.apply(_b, [(_d.data = (_e.passwordHash = _f.sent(), _e),
                        _d)])];
            case 4:
                _f.sent();
                res.json({ success: true });
                return [2 /*return*/];
        }
    });
}); }));
exports.default = router;
