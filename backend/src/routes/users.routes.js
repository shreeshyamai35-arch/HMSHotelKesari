"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = __importDefault(require("../lib/prisma"));
const asyncHandler_1 = require("../lib/asyncHandler");
const auth_1 = require("../middleware/auth");
const password_1 = require("../lib/password");
const roles_1 = require("../constants/roles");
const errors_1 = require("../lib/errors");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate, (0, auth_1.authorize)(roles_1.ROLES.ADMIN));
const publicUser = {
    id: true,
    name: true,
    email: true,
    role: true,
    department: true,
    active: true,
    createdAt: true,
};
router.get('/', (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const users = await prisma_1.default.user.findMany({
        select: publicUser,
        orderBy: { createdAt: 'desc' },
    });
    res.json(users);
}));
const createSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    role: zod_1.z.enum([roles_1.ROLES.ADMIN, roles_1.ROLES.FRONT_OFFICE, roles_1.ROLES.REVENUE, roles_1.ROLES.MANAGEMENT]),
    department: zod_1.z.string().optional().nullable(),
});
router.post('/', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const data = createSchema.parse(req.body);
    const exists = await prisma_1.default.user.findUnique({ where: { email: data.email.toLowerCase() } });
    if (exists)
        throw (0, errors_1.badRequest)('A user with this email already exists');
    const user = await prisma_1.default.user.create({
        data: {
            name: data.name,
            email: data.email.toLowerCase(),
            passwordHash: await (0, password_1.hashPassword)(data.password),
            role: data.role,
            department: data.department ?? null,
        },
        select: publicUser,
    });
    res.status(201).json(user);
}));
const updateSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    role: zod_1.z.enum([roles_1.ROLES.ADMIN, roles_1.ROLES.FRONT_OFFICE, roles_1.ROLES.REVENUE, roles_1.ROLES.MANAGEMENT]).optional(),
    department: zod_1.z.string().optional().nullable(),
    active: zod_1.z.boolean().optional(),
});
router.patch('/:id', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const data = updateSchema.parse(req.body);
    const existing = await prisma_1.default.user.findUnique({ where: { id: req.params.id } });
    if (!existing)
        throw (0, errors_1.notFound)('User not found');
    const user = await prisma_1.default.user.update({
        where: { id: req.params.id },
        data,
        select: publicUser,
    });
    res.json(user);
}));
const resetSchema = zod_1.z.object({ newPassword: zod_1.z.string().min(6) });
router.post('/:id/reset-password', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { newPassword } = resetSchema.parse(req.body);
    const existing = await prisma_1.default.user.findUnique({ where: { id: req.params.id } });
    if (!existing)
        throw (0, errors_1.notFound)('User not found');
    await prisma_1.default.user.update({
        where: { id: req.params.id },
        data: { passwordHash: await (0, password_1.hashPassword)(newPassword) },
    });
    res.json({ success: true });
}));
router.delete('/:id', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const existing = await prisma_1.default.user.findUnique({ where: { id: req.params.id } });
    if (!existing)
        throw (0, errors_1.notFound)('User not found');
    // Soft-deactivate rather than hard delete to preserve report history.
    await prisma_1.default.user.update({ where: { id: req.params.id }, data: { active: false } });
    res.json({ success: true });
}));
router.get('/roles', (_req, res) => res.json(roles_1.ALL_ROLES));
exports.default = router;
