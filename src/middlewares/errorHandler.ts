import type { NextFunction, Request, Response } from 'express';

export interface HttpError extends Error {
  statusCode?: number;
}

export const errorHandler = (
  err: HttpError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const statusCode = err.statusCode ?? 500;
  res.status(statusCode).json({ error: err.message || 'Internal Server Error' });
};
