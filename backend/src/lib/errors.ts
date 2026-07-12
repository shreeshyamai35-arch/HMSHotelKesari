export class AppError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const badRequest = (msg: string, details?: unknown) => new AppError(400, msg, details);
export const unauthorized = (msg = 'Unauthorized') => new AppError(401, msg);
export const forbidden = (msg = 'Forbidden') => new AppError(403, msg);
export const notFound = (msg = 'Not found') => new AppError(404, msg);
export const conflict = (msg: string) => new AppError(409, msg);
