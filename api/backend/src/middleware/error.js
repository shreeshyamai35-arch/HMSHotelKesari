"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = notFoundHandler;
exports.errorHandler = errorHandler;
const zod_1 = require("zod");
const errors_1 = require("../lib/errors");
function notFoundHandler(_req, res) {
    res.status(404).json({ error: 'Route not found' });
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function errorHandler(err, _req, res, _next) {
    if (err instanceof zod_1.ZodError) {
        return res.status(400).json({
            error: 'Validation failed',
            details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
        });
    }
    if (err instanceof errors_1.AppError) {
        return res.status(err.statusCode).json({ error: err.message, details: err.details });
    }
    // Prisma known errors surface as objects with a `code`
    const anyErr = err;
    if (anyErr?.code === 'P2002') {
        return res.status(409).json({ error: 'A record with these unique values already exists' });
    }
    if (anyErr?.code === 'P2025') {
        return res.status(404).json({ error: 'Record not found' });
    }
    console.error('[Unhandled error]', err);
    res.status(500).json({ error: 'Internal server error' });
}
