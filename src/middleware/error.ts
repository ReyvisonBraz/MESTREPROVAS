import { Request, Response, NextFunction } from 'express';
import { isAppError } from '../errors/index.js';
import { logger } from '../lib/logger.js';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = req.id;

  if (isAppError(err)) {
    logger.warn(`Operational error: ${err.message}`, {
      request_id: requestId,
      code: err.code,
      stack: err.stack,
    });

    res.status(err.statusCode).json({
      title: err.code,
      status: err.statusCode,
      detail: err.message,
      request_id: requestId,
    });
    return;
  }

  logger.error(`Unexpected error: ${err.message}`, {
    request_id: requestId,
    error: err.message,
    stack: err.stack,
  });

  res.status(500).json({
    title: 'INTERNAL_ERROR',
    status: 500,
    detail: 'An unexpected error occurred. Please try again later.',
    request_id: requestId,
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    title: 'NOT_FOUND',
    status: 404,
    detail: `Cannot ${req.method} ${req.path}`,
    request_id: req.id,
  });
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
