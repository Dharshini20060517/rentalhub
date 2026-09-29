import rateLimit from 'express-rate-limit';

/** General API rate limit: 100 requests per 15 minutes per IP. */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'TOO_MANY_REQUESTS', message: 'Too many requests, try again later' } },
});

/** Stricter limit for auth endpoints: 10 attempts per 15 minutes. */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'TOO_MANY_REQUESTS', message: 'Too many auth attempts, try again later' } },
});
