import type { NextFunction, Request, Response } from 'express';
import type { ErrorResponse } from '../types/reservation';

export interface HttpError extends Error {
  statusCode?: number;
  code?: string;
}

const isJsonSyntaxError = (err: HttpError): boolean =>
  err instanceof SyntaxError && err.statusCode === 400;

export const errorHandler = (
  err: HttpError,
  _req: Request,
  res: Response<ErrorResponse>,
  _next: NextFunction,
): void => {
  if (isJsonSyntaxError(err)) {
    res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Request body must be valid JSON.',
    });
    return;
  }

  const statusCode = err.statusCode ?? 500;
  const isServerError = statusCode >= 500;
  res.status(statusCode).json({
    code: err.code ?? (isServerError ? 'INTERNAL_SERVER_ERROR' : 'ERROR'),
    message: isServerError ? 'Internal Server Error' : err.message,
  });
};
