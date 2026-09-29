import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { ParamsDictionary } from 'express-serve-static-core';

type AsyncRequestHandler<P, ResBody> = (
  req: Request<P>,
  res: Response<ResBody>,
  next: NextFunction,
) => Promise<void>;

export const asyncHandler = <P = ParamsDictionary, ResBody = unknown>(
  handler: AsyncRequestHandler<P, ResBody>,
): RequestHandler<P, ResBody> => {
  return (req: Request<P>, res: Response<ResBody>, next: NextFunction): void => {
    handler(req, res, next).catch(next);
  };
};
