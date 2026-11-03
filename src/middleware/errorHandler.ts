import type { NextFunction, Request, Response } from 'express';
import type { ErrorResponse } from '../types/reservation';
import { AppError, type AppErrorKind } from '../utils/errors';

/** Errors raised by Express itself (e.g. body-parser) carry an HTTP status. */
export interface HttpError extends Error {
  statusCode?: number;
}

const STATUS_BY_KIND: Record<AppErrorKind, number> = {
  VALIDATION: 400,
  NOT_FOUND: 404,
  CONFLICT: 409,
};

const isJsonSyntaxError = (err: HttpError): boolean =>
  err instanceof SyntaxError && err.statusCode === 400;

export const notFoundHandler = (req: Request, res: Response<ErrorResponse>): void => {
  res.status(404).json({ code: 'ROUTE_NOT_FOUND', message: `Cannot ${req.method} ${req.path}` });
};

export const errorHandler = (
  err: HttpError,
  _req: Request,
  res: Response<ErrorResponse>,
  _next: NextFunction,
): void => {
  if (err instanceof AppError) {
    res.status(STATUS_BY_KIND[err.kind]).json({ code: err.code, message: err.message });
    return;
  }
  if (isJsonSyntaxError(err)) {
    res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Request body must be valid JSON.' });
    return;
  }

  console.error(err);
  res.status(500).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal Server Error' });
};
