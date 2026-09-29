import type { HttpError } from '../middlewares/errorHandler';

export const createHttpError = (statusCode: number, code: string, message: string): HttpError => {
  const error: HttpError = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
};
