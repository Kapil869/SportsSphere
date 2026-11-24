/** Shape sent to the frontend. `id` is the URL hash, so it works whether or not MongoDB is connected. */
export function toPublic(a) {
  return {
    id: a.urlHash,
    title: a.title,
    description: a.description || '',
    contentSnippet: a.content || '',
    url: a.url,
    image: a.image || null,
    publishedAt: new Date(a.publishedAt).toISOString(),
    source: { name: a.source?.name || 'Unknown source', url: a.source?.url || '' },
    category: a.category || a.categories?.[0] || 'other',
    categories: a.categories || [],
  };
}

/** Removes duplicate articles (by id) while keeping order. */
export function uniqueById(list) {
  const seen = new Set();
  return list.filter((a) => (seen.has(a.id) ? false : seen.add(a.id)));
}
