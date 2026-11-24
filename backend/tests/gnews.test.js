import test from 'node:test';
import assert from 'node:assert/strict';
import { createGNewsClient, normalizeArticle } from '../src/services/gnewsService.js';

const cfg = { apiKey: 'secret-key', baseUrl: 'https://gnews.io/api/v4', lang: 'en', country: '' };
const jsonResponse = (body, status = 200, headers = {}) => ({
  ok: status >= 200 && status < 300, status, headers: new Headers(headers), json: async () => body,
});
const raw = (n) => ({ id: `id${n}`, title: `Story ${n}`, description: 'desc', content: 'Body text... [1234 chars]', url: `https://pub.example/${n}?utm_source=a`, image: 'https://img.example/a.jpg', publishedAt: '2026-11-20T10:00:00Z', source: { name: 'Pub', url: 'https://pub.example' } });

test('normalizeArticle cleans content marker and rejects unusable items', () => {
  const a = normalizeArticle(raw(1));
  assert.equal(a.content, 'Body text');
  assert.equal(a.source.name, 'Pub');
  assert.match(a.urlHash, /^[a-f0-9]{40}$/);
  assert.equal(normalizeArticle({ title: 'No url' }), null);
  assert.equal(normalizeArticle({ title: 'Bad', url: 'javascript:alert(1)' }), null);
  assert.equal(normalizeArticle(raw(2) && { ...raw(2), image: 'not-a-url' }).image, null);
  assert.equal(normalizeArticle(null), null);
});

test('client sends key + params, returns normalised articles', async () => {
  let seen;
  const client = createGNewsClient({ ...cfg, fetchImpl: async (url) => { seen = new URL(url); return jsonResponse({ totalArticles: 2, articles: [raw(1), raw(2), { title: 'junk' }] }); } });
  const res = await client.search({ q: 'cricket', max: 5 });
  assert.equal(seen.pathname, '/api/v4/search');
  assert.equal(seen.searchParams.get('q'), 'cricket');
  assert.equal(seen.searchParams.get('apikey'), 'secret-key');
  assert.equal(seen.searchParams.get('country'), null);
  assert.equal(res.articles.length, 2);
});

test('client maps failures to safe AppErrors without leaking the key', async () => {
  const cases = [[401, 'NEWS_API_AUTH'], [403, 'NEWS_API_QUOTA'], [429, 'NEWS_API_RATE_LIMIT'], [500, 'NEWS_API_UNAVAILABLE'], [400, 'NEWS_API_BAD_REQUEST']];
  for (const [status, code] of cases) {
    const client = createGNewsClient({ ...cfg, fetchImpl: async () => jsonResponse({}, status, { 'retry-after': '30' }) });
    await assert.rejects(client.topHeadlines(), (e) => e.code === code && e.upstream === true && !e.message.includes('secret-key'));
  }
  const down = createGNewsClient({ ...cfg, fetchImpl: async () => { throw new TypeError('fetch failed secret-key'); } });
  await assert.rejects(down.topHeadlines(), (e) => e.code === 'NEWS_API_UNREACHABLE' && !e.message.includes('secret-key'));
  const slow = createGNewsClient({ ...cfg, timeoutMs: 20, fetchImpl: (url, { signal }) => new Promise((_, rej) => signal.addEventListener('abort', () => rej(Object.assign(new Error('x'), { name: 'AbortError' })))) });
  await assert.rejects(slow.topHeadlines(), { code: 'NEWS_API_TIMEOUT' });
});

test('client reports a missing key before making any request', async () => {
  let called = false;
  const client = createGNewsClient({ ...cfg, apiKey: '', fetchImpl: async () => { called = true; } });
  await assert.rejects(client.topHeadlines(), { code: 'NEWS_API_KEY_MISSING', status: 503 });
  assert.equal(called, false);
});
