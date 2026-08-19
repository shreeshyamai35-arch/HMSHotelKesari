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
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
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
var canEdit = (0, auth_1.authorize)(roles_1.ROLES.ADMIN, roles_1.ROLES.REVENUE, roles_1.ROLES.MANAGEMENT);
router.get('/', (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var source, reviews;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                source = req.query.source;
                return [4 /*yield*/, prisma_1.default.review.findMany({
                        where: source ? { source: source } : {},
                        orderBy: { reviewedAt: 'desc' },
                        take: 300,
                    })];
            case 1:
                reviews = _a.sent();
                res.json(reviews);
                return [2 /*return*/];
        }
    });
}); }));
var createSchema = zod_1.z.object({
    source: zod_1.z.enum(['GOOGLE', 'OTA', 'OTHER']),
    rating: zod_1.z.number().min(0).max(5),
    text: zod_1.z.string().optional().nullable(),
    author: zod_1.z.string().optional().nullable(),
    category: zod_1.z.string().optional().nullable(),
    reviewedAt: zod_1.z.string().optional(),
});
router.post('/', canEdit, (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var data, review;
    var _a, _b, _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                data = createSchema.parse(req.body);
                return [4 /*yield*/, prisma_1.default.review.create({
                        data: {
                            source: data.source,
                            rating: data.rating,
                            text: (_a = data.text) !== null && _a !== void 0 ? _a : null,
                            author: (_b = data.author) !== null && _b !== void 0 ? _b : null,
                            category: (_c = data.category) !== null && _c !== void 0 ? _c : null,
                            reviewedAt: (0, dates_1.parseDate)(data.reviewedAt),
                        },
                    })];
            case 1:
                review = _d.sent();
                res.status(201).json(review);
                return [2 /*return*/];
        }
    });
}); }));
router.delete('/:id', canEdit, (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var existing;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma_1.default.review.findUnique({ where: { id: req.params.id } })];
            case 1:
                existing = _a.sent();
                if (!existing)
                    throw (0, errors_1.notFound)('Review not found');
                return [4 /*yield*/, prisma_1.default.review.delete({ where: { id: req.params.id } })];
            case 2:
                _a.sent();
                res.json({ success: true });
                return [2 /*return*/];
        }
    });
}); }));
// Rating & complaint analysis
router.get('/analytics', (0, asyncHandler_1.asyncHandler)(function (_req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var reviews, total, avgRating, bySource, distribution, reviews_1, reviews_1_1, r, src, bucket, _a, openComplaints, closedComplaints;
    var e_1, _b;
    var _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0: return [4 /*yield*/, prisma_1.default.review.findMany()];
            case 1:
                reviews = _d.sent();
                total = reviews.length;
                avgRating = total ? reviews.reduce(function (s, r) { return s + r.rating; }, 0) / total : 0;
                bySource = {};
                distribution = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
                try {
                    for (reviews_1 = __values(reviews), reviews_1_1 = reviews_1.next(); !reviews_1_1.done; reviews_1_1 = reviews_1.next()) {
                        r = reviews_1_1.value;
                        src = r.source;
                        if (!bySource[src])
                            bySource[src] = { count: 0, avg: 0 };
                        bySource[src].count += 1;
                        bySource[src].avg += r.rating;
                        bucket = String(Math.min(5, Math.max(1, Math.round(r.rating))));
                        distribution[bucket] = ((_c = distribution[bucket]) !== null && _c !== void 0 ? _c : 0) + 1;
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (reviews_1_1 && !reviews_1_1.done && (_b = reviews_1.return)) _b.call(reviews_1);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
                Object.keys(bySource).forEach(function (k) {
                    bySource[k].avg = bySource[k].count ? +(bySource[k].avg / bySource[k].count).toFixed(2) : 0;
                });
                return [4 /*yield*/, Promise.all([
                        prisma_1.default.complaint.count({ where: { status: 'OPEN' } }),
                        prisma_1.default.complaint.count({ where: { status: 'CLOSED' } }),
                    ])];
            case 2:
                _a = __read.apply(void 0, [_d.sent(), 2]), openComplaints = _a[0], closedComplaints = _a[1];
                res.json({
                    total: total,
                    avgRating: +avgRating.toFixed(2),
                    bySource: bySource,
                    distribution: distribution,
                    negativeCount: reviews.filter(function (r) { return r.rating <= 2; }).length,
                    complaints: { open: openComplaints, closed: closedComplaints },
                });
                return [2 /*return*/];
        }
    });
}); }));
exports.default = router;
