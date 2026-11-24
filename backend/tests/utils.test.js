import test from 'node:test';
import assert from 'node:assert/strict';
import { TTLCache } from '../src/utils/cache.js';
import { urlHash, normalizeUrl } from '../src/utils/hash.js';
import { detectCategories, tagArticles, isValidCategory, CATEGORIES } from '../src/utils/categories.js';
import { parsePage, parseSearchQuery, parseCategory, parseArticleId } from '../src/utils/validators.js';

test('cache: stores, expires, and de-duplicates in-flight loads', async () => {
  const c = new TTLCache({ ttlMs: 30, maxEntries: 2 });
  let calls = 0;
  const loader = async () => { calls += 1; await new Promise((r) => setTimeout(r, 10)); return 'v'; };
  const [a, b] = await Promise.all([c.wrap('k', loader), c.wrap('k', loader)]);
  assert.equal(calls, 1);
  assert.equal(a.value, 'v');
  assert.equal(b.value, 'v');
  assert.equal((await c.wrap('k', loader)).cached, true);
  await new Promise((r) => setTimeout(r, 40));
  assert.equal(c.get('k'), undefined);
  c.set('1', 1); c.set('2', 2); c.set('3', 3);
  assert.equal(c.size, 2);
});

test('cache: failed loads are not cached', async () => {
  const c = new TTLCache();
  await assert.rejects(c.wrap('x', async () => { throw new Error('boom'); }));
  assert.equal((await c.wrap('x', async () => 'ok')).value, 'ok');
});

test('hash: tracking params, fragments and trailing slashes do not change the id', () => {
  const a = urlHash('https://Example.com/story/1/?utm_source=x&id=7#top');
  const b = urlHash('https://example.com/story/1?id=7');
  assert.equal(a, b);
  assert.notEqual(a, urlHash('https://example.com/story/2?id=7'));
  assert.match(a, /^[a-f0-9]{40}$/);
  assert.equal(normalizeUrl('not a url'), 'not a url');
});

test('categories: ten sections, detection and tagging', () => {
  assert.equal(CATEGORIES.length, 10);
  assert.ok(isValidCategory('formula-1'));
  assert.ok(!isValidCategory('chess'));
  assert.deepEqual(detectCategories('Kohli hits a T20 century'), ['cricket']);
  assert.ok(detectCategories('Verstappen wins the Grand Prix').includes('formula-1'));
  assert.deepEqual(detectCategories('Local council meets'), ['other']);
  const [t] = tagArticles([{ title: 'NBA finals tip off', description: '' }], ['basketball']);
  assert.equal(t.category, 'basketball');
  assert.deepEqual(t.categories, ['basketball']);
});

test('validators accept good input and reject bad input', () => {
  assert.equal(parsePage(undefined), 1);
  assert.equal(parsePage('3'), 3);
  for (const bad of ['0', '-1', 'abc', '1.5', '999']) assert.throws(() => parsePage(bad), { code: 'INVALID_PAGE' });
  assert.equal(parseSearchQuery('  wimbledon   final '), 'wimbledon final');
  for (const bad of [undefined, '', ' a ', 'x'.repeat(101), ['a', 'b']]) assert.throws(() => parseSearchQuery(bad), { code: 'INVALID_QUERY' });
  assert.equal(parseCategory('Cricket'), 'cricket');
  assert.throws(() => parseCategory('chess'), { status: 404 });
  assert.throws(() => parseArticleId('nope'), { code: 'INVALID_ARTICLE_ID' });
  assert.equal(parseArticleId('A'.repeat(40)), 'a'.repeat(40));
});
