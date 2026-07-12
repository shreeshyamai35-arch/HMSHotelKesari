import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { asyncHandler } from '../lib/asyncHandler';
import { authenticate, authorize } from '../middleware/auth';
import { hashPassword } from '../lib/password';
import { ROLES, ALL_ROLES } from '../constants/roles';
import { badRequest, notFound } from '../lib/errors';

const router = Router();

router.use(authenticate, authorize(ROLES.ADMIN));

const publicUser = {
  id: true,
  name: true,
  email: true,
  role: true,
  department: true,
  active: true,
  createdAt: true,
} as const;

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({
      select: publicUser,
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  })
);

const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum([ROLES.ADMIN, ROLES.FRONT_OFFICE, ROLES.REVENUE, ROLES.MANAGEMENT]),
  department: z.string().optional().nullable(),
});

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = createSchema.parse(req.body);
    const exists = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
    if (exists) throw badRequest('A user with this email already exists');
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        passwordHash: await hashPassword(data.password),
        role: data.role,
        department: data.department ?? null,
      },
      select: publicUser,
    });
    res.status(201).json(user);
  })
);

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.enum([ROLES.ADMIN, ROLES.FRONT_OFFICE, ROLES.REVENUE, ROLES.MANAGEMENT]).optional(),
  department: z.string().optional().nullable(),
  active: z.boolean().optional(),
});

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const data = updateSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!existing) throw notFound('User not found');
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
      select: publicUser,
    });
    res.json(user);
  })
);

const resetSchema = z.object({ newPassword: z.string().min(6) });

router.post(
  '/:id/reset-password',
  asyncHandler(async (req, res) => {
    const { newPassword } = resetSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!existing) throw notFound('User not found');
    await prisma.user.update({
      where: { id: req.params.id },
      data: { passwordHash: await hashPassword(newPassword) },
    });
    res.json({ success: true });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!existing) throw notFound('User not found');
    // Soft-deactivate rather than hard delete to preserve report history.
    await prisma.user.update({ where: { id: req.params.id }, data: { active: false } });
    res.json({ success: true });
  })
);

router.get('/roles', (_req, res) => res.json(ALL_ROLES));

export default router;
