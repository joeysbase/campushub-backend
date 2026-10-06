/**
 * Framework-agnostic application errors. Services throw these; the HTTP layer
 * (middlewares/errorHandler.ts) maps each kind to a status code.
 */
export type AppErrorKind = 'VALIDATION' | 'NOT_FOUND' | 'CONFLICT';

export class AppError extends Error {
  readonly kind: AppErrorKind;
  readonly code: string;

  constructor(kind: AppErrorKind, code: string, message: string) {
    super(message);
    this.name = 'AppError';
    this.kind = kind;
    this.code = code;
  }
}

export const validationError = (message: string): AppError =>
  new AppError('VALIDATION', 'VALIDATION_ERROR', message);

export const notFoundError = (code: string, message: string): AppError =>
  new AppError('NOT_FOUND', code, message);

export const conflictError = (code: string, message: string): AppError =>
  new AppError('CONFLICT', code, message);
