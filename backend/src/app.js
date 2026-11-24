import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import newsRoutes from './routes/newsRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import { AppError } from './utils/AppError.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  if (env.trustProxy) app.set('trust proxy', env.trustProxy);
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

  app.use(
    cors({
      methods: ['GET', 'OPTIONS'],
      origin(origin, callback) {
        // No Origin header = curl/Postman/server-to-server, which is fine.
        if (!origin || env.clientOrigins.includes(origin)) return callback(null, true);
        callback(new AppError(403, 'CORS_FORBIDDEN', 'This origin is not allowed to use the API.'));
      },
    }),
  );

  app.use('/api', rateLimiter({ max: env.rateLimitPerMin }));
  // Browsers and CDNs may reuse news responses briefly; the server-side cache does the heavy lifting.
  app.use('/api/news', (req, res, next) => {
    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
    next();
  });

  app.use('/api/health', healthRoutes);
  app.use('/api/news', newsRoutes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
