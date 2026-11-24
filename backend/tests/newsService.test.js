// Exercises the orchestration layer with GNews mocked and MongoDB NOT connected
// (the "database down" path: memory cache + graceful degradation).
import test from 'node:test';
import assert from 'node:assert/strict';

process.env.GNEWS_API_KEY = 'test-key';
process.env.HOME_SECTIONS = 'cricket,tennis';

const mk = (n, extra = {}) => ({
  id: `g${n}`, title: `Story ${n}`, description: `desc ${n}`, content: `body ${n}... [99 chars]`,
  url: `https://pub.example/${n}`, image: n % 2 ? 'https://img.example/x.jpg' : null,
  publishedAt: new Date(Date.UTC(2026, 10, 20, 12, n)).toISOString(), source: { name: 'Pub', url: 'https://pub.example' }, ...extra,
});
const calls = [];
let mode = 'ok';
globalThis.fetch = async (url) => {
  const u = new URL(url);
  calls.push(u);
  if (mode === 'quota') return { ok: false, status: 403, headers: new Headers(), json: async () => ({}) };
  const q = u.searchParams.get('q') || 'headlines';
  const base = q === 'cricket' ? 100 : q === 'tennis' ? 200 : q === 'headlines' ? 0 : 300;
  const items = Array.from({ length: 6 }, (_, i) => mk(base + i + 1, q === 'cricket' ? { title: `Cricket story ${i}` } : {}));
  items.push(items[0]); // duplicate must be removed
  return { ok: true, status: 200, headers: new Headers(), json: async () => ({ totalArticles: 7, articles: items }) };
};

const svc = await import('../src/services/newsService.js');

test('home is composed from headlines + sections, with no duplicates', async () => {
  svc.clearCache();
  const home = await svc.getHome();
  assert.ok(home.featured.image, 'featured prefers a story with an image');
  assert.equal(home.trending.length, 5);
  assert.deepEqual(home.sections.map((s) => s.slug), ['cricket', 'tennis']);
  const ids = [home.featured, ...home.trending, ...home.latest].map((a) => a.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(home.meta.stale, false);
});

test('responses are cached: a second call makes no new GNews requests', async () => {
  const before = calls.length;
  await svc.getHome();
  await svc.getCategoryNews('cricket', 1);
  assert.equal(calls.length, before);
});

test('category fetch dedupes, tags articles with the section and flags source', async () => {
  svc.clearCache();
  const res = await svc.getCategoryNews('cricket', 1);
  assert.equal(res.articles.length, 6);
  assert.ok(res.articles.every((a) => a.categories.includes('cricket') && a.category === 'cricket'));
  assert.equal(res.meta.source, 'live');
  assert.equal((await svc.getCategoryNews('cricket', 1)).meta.source, 'cache');
});

test('search returns results, and page 2 without MongoDB is empty rather than an error', async () => {
  svc.clearCache();
  const res = await svc.searchNews('wimbledon final', 1);
  assert.ok(res.articles.length > 0);
  assert.equal(res.meta.query, 'wimbledon final');
  const p2 = await svc.searchNews('wimbledon final', 2);
  assert.deepEqual(p2.articles, []);
  assert.equal(p2.meta.hasMore, false);
});

test('article details work from the in-memory index when MongoDB is down', async () => {
  svc.clearCache();
  const { articles } = await svc.getCategoryNews('tennis', 1);
  const { article, related } = await svc.getArticle(articles[0].id);
  assert.equal(article.id, articles[0].id);
  assert.equal(article.contentSnippet, 'body 201');
  assert.deepEqual(related, []);
  await assert.rejects(svc.getArticle('0'.repeat(40)), { code: 'ARTICLE_NOT_FOUND', status: 404 });
});

test('quota exhaustion surfaces a clear 429 when there is no stored fallback', async () => {
  svc.clearCache();
  mode = 'quota';
  await assert.rejects(svc.getCategoryNews('football', 1), { code: 'NEWS_API_QUOTA', status: 429 });
  await assert.rejects(svc.getHome(), { code: 'NEWS_API_QUOTA' });
  mode = 'ok';
});
