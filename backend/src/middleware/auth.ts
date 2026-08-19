import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../lib/jwt';
import { unauthorized, forbidden } from '../lib/errors';
import { prisma } from '../lib/prisma';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(unauthorized('Missing or invalid Authorization header'));
  }
  const token = header.slice('Bearer '.length).trim();
  try {
    req.user = verifyToken(token);

    // Verify user is still active
    const user = await prisma.user.findUnique({
      where: { id: req.user.sub },
      select: { active: true }
    });

    if (!user || !user.active) {
      return next(unauthorized('Account deactivated'));
    }

    next();
  } catch {
    next(unauthorized('Invalid or expired token'));
  }
}

export function authorize(...allowedRoles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(unauthorized());
    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
      return next(forbidden('You do not have permission to access this resource'));
    }
    next();
  };
}
