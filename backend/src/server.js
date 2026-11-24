import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { createApp } from './app.js';
import { logger } from './utils/logger.js';

async function main() {
  if (!env.gnews.apiKey) {
    logger.warn('GNEWS_API_KEY is not set. The API will start, but live news requests will fail until you add a key to backend/.env.');
  }

  const app = createApp();
  const server = app.listen(env.port, () => logger.info(`Sportsphere API listening on http://localhost:${env.port}`));
  server.on('error', (err) => {
    logger.error(err.code === 'EADDRINUSE' ? `Port ${env.port} is already in use. Set PORT in backend/.env.` : err.message);
    process.exit(1);
  });

  connectDB(); // intentionally not awaited: the API is usable while MongoDB connects or retries

  const shutdown = async (signal) => {
    logger.info(`${signal} received, shutting down`);
    server.close(async () => {
      await disconnectDB().catch(() => {});
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

process.on('unhandledRejection', (reason) => logger.error('Unhandled rejection:', reason));
main();
