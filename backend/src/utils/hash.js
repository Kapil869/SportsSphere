import { createHash } from 'node:crypto';

const TRACKING_PARAM = /^(utm_|fbclid$|gclid$|mc_|ref$|ref_)/i;

/** Strips fragments and tracking params so the same story linked two ways is one article. */
export function normalizeUrl(raw) {
  try {
    const u = new URL(raw);
    for (const key of [...u.searchParams.keys()]) {
      if (TRACKING_PARAM.test(key)) u.searchParams.delete(key);
    }
    u.searchParams.sort();
    const path = u.pathname.replace(/\/+$/, '') || '/';
    return `${u.protocol}//${u.host.toLowerCase()}${path}${u.search}`;
  } catch {
    return String(raw).trim();
  }
}

/** Stable 40-char id for an article, derived from its publisher URL. */
export const urlHash = (url) => createHash('sha1').update(normalizeUrl(url)).digest('hex');
