import { logger } from '../utils/logger.js';

export function notFound(req, res) {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: `No route for ${req.method} ${req.path}` } });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  const status = err.status || 500;
  const code = err.code && typeof err.code === 'string' ? err.code : 'INTERNAL_ERROR';
  let message = err.message;

  if (status >= 500) {
    logger.error(`${req.method} ${req.originalUrl} -> ${status} ${code}: ${err.message}`);
    if (!err.expose) message = 'Something went wrong on our side. Please try again.';
  }
  if (err.retryAfter) res.set('Retry-After', String(err.retryAfter));
  res.status(status).json({ error: { code, message } });
}
