"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.authorize = authorize;
const jwt_1 = require("../lib/jwt");
const errors_1 = require("../lib/errors");
const prisma_1 = require("../lib/prisma");
async function authenticate(req, _res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        return next((0, errors_1.unauthorized)('Missing or invalid Authorization header'));
    }
    const token = header.slice('Bearer '.length).trim();
    try {
        req.user = (0, jwt_1.verifyToken)(token);
        // Verify user is still active
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: req.user.sub },
            select: { active: true }
        });
        if (!user || !user.active) {
            return next((0, errors_1.unauthorized)('Account deactivated'));
        }
        next();
    }
    catch {
        next((0, errors_1.unauthorized)('Invalid or expired token'));
    }
}
function authorize(...allowedRoles) {
    return (req, _res, next) => {
        if (!req.user)
            return next((0, errors_1.unauthorized)());
        if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
            return next((0, errors_1.forbidden)('You do not have permission to access this resource'));
        }
        next();
    };
}
