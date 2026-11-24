import { env } from '../config/env.js';
import { createGNewsClient } from './gnewsService.js';
import * as store from './articleService.js';
import { TTLCache } from '../utils/cache.js';
import { CATEGORIES, getCategory, isValidCategory, tagArticles } from '../utils/categories.js';
import { AppError } from '../utils/AppError.js';
import { toPublic, uniqueById } from '../utils/serialize.js';

const gnews = createGNewsClient(env.gnews);
const cache = new TTLCache({ ttlMs: env.cacheTtlMs, maxEntries: 300 });
const SEARCH_TTL_MS = Math.min(env.cacheTtlMs, 15 * 60 * 1000);

/** Stories per page. Page 1 is live from GNews; later pages come from the MongoDB archive. */
export const PAGE_SIZE = env.gnews.maxPerRequest;

export const getCacheStats = () => ({ entries: cache.size });
export const clearCache = () => cache.clear();

const byNewest = (a, b) => new Date(b.publishedAt) - new Date(a.publishedAt);

/** Tags, persists and remembers freshly fetched articles, then returns them in public shape. */
async function ingest(articles, forced = []) {
  const tagged = tagArticles(uniqueByHash(articles), forced);
  store.remember(tagged);
  await store.saveArticles(tagged); // never throws; no-op without MongoDB
  return tagged.map(toPublic);
}
const uniqueByHash = (list) => {
  const seen = new Set();
  return list.filter((a) => (seen.has(a.urlHash) ? false : seen.add(a.urlHash)));
};

/** Wraps a live loader with a stored fallback: if GNews fails (quota, outage, no key) serve the archive, flagged stale. */
async function withArchiveFallback(live, archive) {
  try {
    return await live();
  } catch (err) {
    if (!err?.upstream) throw err;
    const articles = (await archive()).map(toPublic);
    if (!articles.length) throw err;
    return { articles, source: 'database', stale: true, cached: false, notice: err.message };
  }
}

// ---------------------------------------------------------------- headlines
async function getHeadlines() {
  return withArchiveFallback(
    async () => {
      const { value, cached } = await cache.wrap('headlines', async () => {
        const { articles } = await gnews.topHeadlines({ category: 'sports', max: PAGE_SIZE });
        return { articles: await ingest(articles), source: 'live' };
      });
      return { ...value, source: cached ? 'cache' : value.source, cached };
    },
    () => store.latest(PAGE_SIZE),
  );
}

// ---------------------------------------------------------------- category
async function loadCategoryPage1(cat) {
  // 1) MongoDB as a persistent cache: survives restarts, so a restart does not burn GNews quota.
  const fresh = await store.findFresh(cat.slug, PAGE_SIZE, env.cacheTtlMs);
  if (fresh.length >= Math.min(PAGE_SIZE, 6)) return { articles: fresh.map(toPublic), source: 'database' };
  // 2) Live from GNews.
  const { articles } = await gnews.search({ q: cat.query, max: PAGE_SIZE });
  return { articles: await ingest(articles, [cat.slug]), source: 'live' };
}

async function archivePage(slug, page) {
  const [docs, total] = await Promise.all([
    store.listArchive({ category: slug, page, pageSize: PAGE_SIZE }),
    store.countArchive(slug),
  ]);
  return {
    articles: docs.map(toPublic),
    meta: { page, pageSize: PAGE_SIZE, source: 'database', total, hasMore: total > page * PAGE_SIZE },
  };
}

export async function getCategoryNews(slug, page = 1) {
  const cat = getCategory(slug);
  if (!cat) throw new AppError(404, 'UNKNOWN_CATEGORY', 'Unknown category.');
  if (page > 1) return archivePage(slug, page);

  const result = await withArchiveFallback(
    async () => {
      const { value, cached } = await cache.wrap(`cat:${slug}`, () => loadCategoryPage1(cat));
      return { ...value, source: cached ? 'cache' : value.source, cached };
    },
    () => store.listArchive({ category: slug, page: 1, pageSize: PAGE_SIZE }),
  );
  const total = await store.countArchive(slug);
  return {
    articles: result.articles,
    meta: {
      page: 1, pageSize: PAGE_SIZE, source: result.source, cached: !!result.cached,
      stale: !!result.stale, notice: result.notice, total, hasMore: total > PAGE_SIZE,
    },
  };
}

// ---------------------------------------------------------------- search
function buildSearchQuery(q) {
  return env.searchSportsOnly ? `(${q}) AND (sport OR sports OR match OR league OR tournament OR championship)` : q;
}

export async function searchNews(q, page = 1) {
  if (page > 1) {
    const [docs, total] = await Promise.all([store.searchArchive({ q, page, pageSize: PAGE_SIZE }), store.countSearch(q)]);
    return { articles: docs.map(toPublic), meta: { query: q, page, pageSize: PAGE_SIZE, source: 'database', total, hasMore: total > page * PAGE_SIZE } };
  }

  const result = await withArchiveFallback(
    async () => {
      const { value, cached } = await cache.wrap(
        `search:${q.toLowerCase()}`,
        async () => {
          const { articles } = await gnews.search({ q: buildSearchQuery(q), max: PAGE_SIZE });
          return { articles: await ingest(articles), source: 'live' };
        },
        SEARCH_TTL_MS,
      );
      return { ...value, source: cached ? 'cache' : value.source, cached };
    },
    () => store.searchArchive({ q, page: 1, pageSize: PAGE_SIZE }),
  );
  const total = await store.countSearch(q);
  return {
    articles: result.articles,
    meta: { query: q, page: 1, pageSize: PAGE_SIZE, source: result.source, cached: !!result.cached, stale: !!result.stale, notice: result.notice, total, hasMore: total > PAGE_SIZE },
  };
}

// ---------------------------------------------------------------- home
export async function getHome() {
  const sectionSlugs = env.homeSections.filter(isValidCategory);
  const [headRes, ...sectionRes] = await Promise.allSettled([
    getHeadlines(),
    ...sectionSlugs.map((slug) => getCategoryNews(slug, 1)),
  ]);

  const errors = [];
  const sections = [];
  sectionRes.forEach((r, i) => {
    const slug = sectionSlugs[i];
    if (r.status === 'fulfilled' && r.value.articles.length) {
      sections.push({ slug, name: getCategory(slug).name, articles: r.value.articles.slice(0, 5), stale: !!r.value.meta.stale });
    } else if (r.status === 'rejected') {
      errors.push({ section: slug, code: r.reason?.code || 'UNKNOWN' });
    }
  });

  const headlines = headRes.status === 'fulfilled' ? headRes.value : null;
  if (headRes.status === 'rejected') errors.push({ section: 'headlines', code: headRes.reason?.code || 'UNKNOWN' });

  const pool = headlines?.articles?.length
    ? headlines.articles
    : uniqueById(sections.flatMap((s) => s.articles)).sort(byNewest);

  if (!pool.length) {
    const firstFailure = [headRes, ...sectionRes].find((r) => r.status === 'rejected');
    throw firstFailure?.reason instanceof AppError
      ? firstFailure.reason
      : new AppError(502, 'NO_NEWS', 'No stories are available yet. Please try again in a moment.');
  }

  const featured = pool.find((a) => a.image) || pool[0];
  const trending = pool.filter((a) => a.id !== featured.id).slice(0, 5);
  const used = new Set([featured.id, ...trending.map((a) => a.id)]);

  // "Latest" comes from MongoDB (newest stored stories); falls back to what we just fetched.
  const stored = (await store.latest(30)).map(toPublic);
  const latest = uniqueById([...stored, ...sections.flatMap((s) => s.articles), ...pool])
    .filter((a) => !used.has(a.id))
    .sort(byNewest)
    .slice(0, 9);

  return {
    featured,
    trending,
    latest,
    sections,
    meta: {
      stale: !!headlines?.stale || sections.some((s) => s.stale),
      notice: headlines?.notice,
      errors,
      generatedAt: new Date().toISOString(),
    },
  };
}

// ---------------------------------------------------------------- article details
export async function getArticle(id) {
  const doc = (await store.findByHash(id)) || store.getRecent(id);
  if (!doc) throw new AppError(404, 'ARTICLE_NOT_FOUND', 'That story is no longer available. Search for it or browse its sport.');
  const relatedDocs = await store.related(doc, 4);
  return { article: toPublic(doc), related: relatedDocs.map(toPublic) };
}

// ---------------------------------------------------------------- categories list
export async function listCategories() {
  const counts = await store.countByCategory();
  return CATEGORIES.map(({ slug, name }) => ({ slug, name, stored: counts[slug] || 0 }));
}
