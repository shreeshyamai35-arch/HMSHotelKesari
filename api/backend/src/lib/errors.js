"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.conflict = exports.notFound = exports.forbidden = exports.unauthorized = exports.badRequest = exports.AppError = void 0;
class AppError extends Error {
    constructor(statusCode, message, details) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
        Object.setPrototypeOf(this, AppError.prototype);
    }
}
exports.AppError = AppError;
const badRequest = (msg, details) => new AppError(400, msg, details);
exports.badRequest = badRequest;
const unauthorized = (msg = 'Unauthorized') => new AppError(401, msg);
exports.unauthorized = unauthorized;
const forbidden = (msg = 'Forbidden') => new AppError(403, msg);
exports.forbidden = forbidden;
const notFound = (msg = 'Not found') => new AppError(404, msg);
exports.notFound = notFound;
const conflict = (msg) => new AppError(409, msg);
exports.conflict = conflict;
