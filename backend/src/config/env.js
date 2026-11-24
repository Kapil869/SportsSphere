import dotenv from 'dotenv';

dotenv.config();

const int = (value, fallback) => {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};
const list = (value, fallback) => {
  const items = (value || '').split(',').map((s) => s.trim()).filter(Boolean);
  return items.length ? items : fallback;
};
const bool = (value) => String(value).toLowerCase() === 'true';

// Behind a proxy (Render, Heroku, nginx) req.ip would be the proxy's address for everyone,
// so the rate limiter needs to trust the forwarded client IP. Number = proxy hops.
const trustProxy = (value, isProd) => {
  if (value === undefined || value === '') return isProd ? 1 : false;
  if (/^\d+$/.test(value)) return Number(value);
  return String(value).toLowerCase() === 'true' ? 1 : false;
};

/** Single, frozen source of truth for configuration. Nothing else reads process.env. */
export const env = Object.freeze({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: int(process.env.PORT, 5000),
  trustProxy: trustProxy(process.env.TRUST_PROXY, process.env.NODE_ENV === 'production'),
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sportsphere',
  clientOrigins: list(process.env.CLIENT_ORIGIN, ['http://localhost:5173']),
  cacheTtlMs: int(process.env.CACHE_TTL_SECONDS, 3600) * 1000,
  rateLimitPerMin: int(process.env.RATE_LIMIT_PER_MIN, 120),
  homeSections: list(process.env.HOME_SECTIONS, ['cricket', 'football', 'basketball', 'tennis']),
  searchSportsOnly: bool(process.env.SEARCH_SPORTS_ONLY),
  gnews: Object.freeze({
    apiKey: (process.env.GNEWS_API_KEY || '').trim().replace(/^your_gnews_api_key_here$/, ''),
    baseUrl: 'https://gnews.io/api/v4',
    lang: process.env.GNEWS_LANG || 'en',
    country: (process.env.GNEWS_COUNTRY || '').trim().toLowerCase(),
    timeoutMs: 8000,
    maxPerRequest: Math.min(int(process.env.GNEWS_MAX_PER_REQUEST, 10), 100),
  }),
});
