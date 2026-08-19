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
const roles_1 = require("../constants/roles");
const dates_1 = require("../lib/dates");
const errors_1 = require("../lib/errors");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
const canEdit = (0, auth_1.authorize)(roles_1.ROLES.ADMIN, roles_1.ROLES.REVENUE, roles_1.ROLES.MANAGEMENT);
router.get('/', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { source } = req.query;
    const reviews = await prisma_1.default.review.findMany({
        where: source ? { source } : {},
        orderBy: { reviewedAt: 'desc' },
        take: 300,
    });
    res.json(reviews);
}));
const createSchema = zod_1.z.object({
    source: zod_1.z.enum(['GOOGLE', 'OTA', 'OTHER']),
    rating: zod_1.z.number().min(0).max(5),
    text: zod_1.z.string().optional().nullable(),
    author: zod_1.z.string().optional().nullable(),
    category: zod_1.z.string().optional().nullable(),
    reviewedAt: zod_1.z.string().optional(),
});
router.post('/', canEdit, (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const data = createSchema.parse(req.body);
    const review = await prisma_1.default.review.create({
        data: {
            source: data.source,
            rating: data.rating,
            text: data.text ?? null,
            author: data.author ?? null,
            category: data.category ?? null,
            reviewedAt: (0, dates_1.parseDate)(data.reviewedAt),
        },
    });
    res.status(201).json(review);
}));
router.delete('/:id', canEdit, (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const existing = await prisma_1.default.review.findUnique({ where: { id: req.params.id } });
    if (!existing)
        throw (0, errors_1.notFound)('Review not found');
    await prisma_1.default.review.delete({ where: { id: req.params.id } });
    res.json({ success: true });
}));
// Rating & complaint analysis
router.get('/analytics', (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const reviews = await prisma_1.default.review.findMany();
    const total = reviews.length;
    const avgRating = total ? reviews.reduce((s, r) => s + r.rating, 0) / total : 0;
    const bySource = {};
    const distribution = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
    for (const r of reviews) {
        const src = r.source;
        if (!bySource[src])
            bySource[src] = { count: 0, avg: 0 };
        bySource[src].count += 1;
        bySource[src].avg += r.rating;
        const bucket = String(Math.min(5, Math.max(1, Math.round(r.rating))));
        distribution[bucket] = (distribution[bucket] ?? 0) + 1;
    }
    Object.keys(bySource).forEach((k) => {
        bySource[k].avg = bySource[k].count ? +(bySource[k].avg / bySource[k].count).toFixed(2) : 0;
    });
    // Complaint analysis (operational complaints)
    const [openComplaints, closedComplaints] = await Promise.all([
        prisma_1.default.complaint.count({ where: { status: 'OPEN' } }),
        prisma_1.default.complaint.count({ where: { status: 'CLOSED' } }),
    ]);
    res.json({
        total,
        avgRating: +avgRating.toFixed(2),
        bySource,
        distribution,
        negativeCount: reviews.filter((r) => r.rating <= 2).length,
        complaints: { open: openComplaints, closed: closedComplaints },
    });
}));
exports.default = router;
