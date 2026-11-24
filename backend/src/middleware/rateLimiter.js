import { AppError } from '../utils/AppError.js';

/** Fixed-window, per-IP limiter held in memory. Fine for a single instance; use a shared store if you scale out. */
export function rateLimiter({ max, windowMs = 60000 }) {
  const hits = new Map();
  const sweep = setInterval(() => {
    const now = Date.now();
    for (const [ip, h] of hits) if (h.reset <= now) hits.delete(ip);
  }, windowMs);
  sweep.unref?.();

  return (req, res, next) => {
    const now = Date.now();
    let h = hits.get(req.ip);
    if (!h || h.reset <= now) {
      h = { count: 0, reset: now + windowMs };
      hits.set(req.ip, h);
    }
    h.count += 1;
    res.set('X-RateLimit-Limit', String(max));
    res.set('X-RateLimit-Remaining', String(Math.max(0, max - h.count)));
    if (h.count > max) {
      const retryAfter = Math.ceil((h.reset - now) / 1000);
      return next(new AppError(429, 'RATE_LIMITED', 'Too many requests. Please slow down.', { retryAfter }));
    }
    next();
  };
}
