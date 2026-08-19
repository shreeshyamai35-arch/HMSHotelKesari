"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const asyncHandler_1 = require("../lib/asyncHandler");
const jwt_1 = require("../lib/jwt");
const password_1 = require("../lib/password");
const auth_1 = require("../middleware/auth");
const errors_1 = require("../lib/errors");
const router = (0, express_1.Router)();
const loginLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many login attempts from this IP, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
});
router.post('/login', loginLimiter, (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);
    const user = await prisma_1.default.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user || !user.active)
        throw (0, errors_1.unauthorized)('Invalid credentials');
    const ok = await (0, password_1.verifyPassword)(password, user.passwordHash);
    if (!ok)
        throw (0, errors_1.unauthorized)('Invalid credentials');
    const token = (0, jwt_1.signToken)({ sub: user.id, email: user.email, role: user.role, name: user.name });
    res.json({
        token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department,
        },
    });
}));
router.get('/me', auth_1.authenticate, (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const user = await prisma_1.default.user.findUnique({ where: { id: req.user.sub } });
    if (!user)
        throw (0, errors_1.unauthorized)();
    res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
    });
}));
const changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1),
    newPassword: zod_1.z.string().min(6),
});
router.post('/change-password', auth_1.authenticate, (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
    const user = await prisma_1.default.user.findUnique({ where: { id: req.user.sub } });
    if (!user)
        throw (0, errors_1.unauthorized)();
    const ok = await (0, password_1.verifyPassword)(currentPassword, user.passwordHash);
    if (!ok)
        throw (0, errors_1.badRequest)('Current password is incorrect');
    await prisma_1.default.user.update({
        where: { id: user.id },
        data: { passwordHash: await (0, password_1.hashPassword)(newPassword) },
    });
    res.json({ success: true });
}));
exports.default = router;
