import { Router } from 'express';
import { env } from '../config/env.js';
import { isDbReady } from '../config/db.js';
import { getCacheStats } from '../services/newsService.js';

const router = Router();

router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    uptimeSeconds: Math.round(process.uptime()),
    database: isDbReady() ? 'connected' : 'disconnected',
    newsApi: env.gnews.apiKey ? 'configured' : 'missing-api-key',
    cache: getCacheStats(),
  });
});

export default router;
