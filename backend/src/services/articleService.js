import { Article } from '../models/Article.js';
import { isDbReady } from '../config/db.js';
import { logger } from '../utils/logger.js';

/**
 * Data-access layer. Every function degrades to an empty result when MongoDB is unavailable,
 * so the API can still answer from GNews and the in-memory cache.
 */
async function guard(fn, fallback) {
  if (!isDbReady()) return fallback;
  try {
    return await fn();
  } catch (err) {
    logger.warn('MongoDB query failed:', err.message);
    return fallback;
  }
}

const prune = (obj) => Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));

// Small LRU-ish index so article pages work even when MongoDB is down.
const recent = new Map();
const RECENT_MAX = 1000;
export function remember(articles) {
  for (const a of articles) {
    recent.delete(a.urlHash);
    recent.set(a.urlHash, a);
  }
  while (recent.size > RECENT_MAX) recent.delete(recent.keys().next().value);
}

/** Upserts tagged articles. Duplicates (same urlHash) update in place and merge their categories. */
export function saveArticles(articles) {
  if (!articles.length) return Promise.resolve(false);
  return guard(async () => {
    const now = new Date();
    const ops = articles.map((a) => ({
      updateOne: {
        filter: { urlHash: a.urlHash },
        update: {
          $set: prune({
            gnewsId: a.gnewsId, title: a.title, description: a.description, content: a.content,
            url: a.url, image: a.image, publishedAt: a.publishedAt, source: a.source, fetchedAt: now,
          }),
          $addToSet: { categories: { $each: a.categories } },
          $setOnInsert: { category: a.category },
        },
        upsert: true,
      },
    }));
    try {
      await Article.bulkWrite(ops, { ordered: false });
    } catch (err) {
      if (!(err?.code === 11000 || err?.writeErrors?.every?.((e) => e.code === 11000))) throw err; // concurrent upsert race
    }
    return true;
  }, false);
}

export const findByHash = (hash) => guard(() => Article.findOne({ urlHash: hash }).lean(), null);
export const getRecent = (hash) => recent.get(hash) || null;

/** Articles in `category` that were fetched within `maxAgeMs`; lets MongoDB act as a persistent cache. */
export const findFresh = (category, limit, maxAgeMs) =>
  guard(
    () =>
      Article.find({ categories: category, fetchedAt: { $gte: new Date(Date.now() - maxAgeMs) } })
        .sort({ publishedAt: -1 }).limit(limit).lean(),
    [],
  );

export const listArchive = ({ category, page, pageSize }) =>
  guard(
    () => Article.find({ categories: category }).sort({ publishedAt: -1 }).skip((page - 1) * pageSize).limit(pageSize).lean(),
    [],
  );
export const countArchive = (category) => guard(() => Article.countDocuments({ categories: category }), 0);

export const searchArchive = ({ q, page, pageSize }) =>
  guard(
    () =>
      Article.find({ $text: { $search: q } }, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' }, publishedAt: -1 }).skip((page - 1) * pageSize).limit(pageSize).lean(),
    [],
  );
export const countSearch = (q) => guard(() => Article.countDocuments({ $text: { $search: q } }), 0);

export const latest = (limit) => guard(() => Article.find({}).sort({ publishedAt: -1 }).limit(limit).lean(), []);

export const related = (article, limit) =>
  guard(
    () => Article.find({ categories: article.category, urlHash: { $ne: article.urlHash } }).sort({ publishedAt: -1 }).limit(limit).lean(),
    [],
  );

/** { cricket: 42, football: 17, ... } for the categories endpoint. */
export const countByCategory = () =>
  guard(async () => {
    const rows = await Article.aggregate([{ $unwind: '$categories' }, { $group: { _id: '$categories', count: { $sum: 1 } } }]);
    return Object.fromEntries(rows.map((r) => [r._id, r.count]));
  }, {});
