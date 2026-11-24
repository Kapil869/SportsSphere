import { AppError } from '../utils/AppError.js';
import { urlHash } from '../utils/hash.js';

const clean = (s) => (typeof s === 'string' ? s.replace(/\s+/g, ' ').trim() : '');
const isHttpUrl = (s) => typeof s === 'string' && /^https?:\/\//i.test(s);

// GNews truncates `content` and appends a marker such as "... [1234 chars]"
const cleanContent = (s) => clean(s).replace(/\s*(\.\.\.|…)?\s*\[\+?\d+ chars?\]\s*$/i, '');

/** Maps one raw GNews article to our internal shape. Returns null for unusable items. */
export function normalizeArticle(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const title = clean(raw.title);
  const url = clean(raw.url);
  if (!title || !isHttpUrl(url)) return null;

  const published = new Date(raw.publishedAt);
  return {
    urlHash: urlHash(url),
    gnewsId: raw.id ? String(raw.id) : undefined,
    title,
    description: clean(raw.description),
    content: cleanContent(raw.content),
    url,
    image: isHttpUrl(raw.image) ? raw.image : null,
    publishedAt: Number.isNaN(published.getTime()) ? new Date() : published,
    source: { name: clean(raw.source?.name) || 'Unknown source', url: isHttpUrl(raw.source?.url) ? raw.source.url : '' },
  };
}

/** Translates GNews HTTP failures into AppErrors. `upstream: true` tells callers a stored fallback is acceptable. */
function mapHttpError(status, headers) {
  const retryAfter = Number(headers?.get?.('retry-after')) || undefined;
  if (status === 401) return new AppError(502, 'NEWS_API_AUTH', 'The news provider rejected the configured API key.', { upstream: true });
  if (status === 403) return new AppError(429, 'NEWS_API_QUOTA', 'The daily news quota has been used up. Try again later.', { upstream: true, retryAfter });
  if (status === 429) return new AppError(429, 'NEWS_API_RATE_LIMIT', 'The news provider is rate limiting us. Try again shortly.', { upstream: true, retryAfter });
  if (status === 400) return new AppError(502, 'NEWS_API_BAD_REQUEST', 'The news provider could not understand the request.', { upstream: true });
  return new AppError(502, 'NEWS_API_UNAVAILABLE', 'The news provider is having problems right now.', { upstream: true });
}

/**
 * Creates a GNews client. Pure factory (no env import, injectable fetch) so it is easy to test.
 * The API key only ever lives inside this closure and is never logged or returned.
 */
export function createGNewsClient({ apiKey, baseUrl, lang, country, timeoutMs = 8000, fetchImpl = globalThis.fetch }) {
  async function request(path, params) {
    if (!apiKey) {
      throw new AppError(503, 'NEWS_API_KEY_MISSING', 'No GNews API key is configured on the server.', { upstream: true });
    }
    const url = new URL(baseUrl + path);
    const all = { ...params, lang, country, apikey: apiKey };
    for (const [k, v] of Object.entries(all)) {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let res;
    try {
      res = await fetchImpl(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
    } catch (err) {
      const timedOut = err?.name === 'AbortError';
      throw new AppError(504, timedOut ? 'NEWS_API_TIMEOUT' : 'NEWS_API_UNREACHABLE',
        timedOut ? 'The news provider took too long to respond.' : 'Could not reach the news provider.', { upstream: true });
    } finally {
      clearTimeout(timer);
    }

    if (!res.ok) throw mapHttpError(res.status, res.headers);

    let body;
    try {
      body = await res.json();
    } catch {
      throw new AppError(502, 'NEWS_API_BAD_RESPONSE', 'The news provider sent an unreadable response.', { upstream: true });
    }
    const articles = (Array.isArray(body?.articles) ? body.articles : []).map(normalizeArticle).filter(Boolean);
    return { articles, totalArticles: Number(body?.totalArticles) || articles.length };
  }

  return {
    topHeadlines: ({ category = 'sports', max = 10 } = {}) => request('/top-headlines', { category, max }),
    search: ({ q, max = 10, sortby = 'publishedAt', in: fields = 'title,description' }) =>
      request('/search', { q, max, sortby, in: fields }),
  };
}
