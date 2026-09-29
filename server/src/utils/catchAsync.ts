import { Request, Response, NextFunction, RequestHandler } from 'express';

/** Wrap async route handlers so rejected promises reach the error middleware. */
export const catchAsync =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };
