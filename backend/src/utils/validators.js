import { AppError } from './AppError.js';
import { isValidCategory } from './categories.js';

export function parsePage(value) {
  if (value === undefined) return 1;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 50) {
    throw new AppError(400, 'INVALID_PAGE', 'page must be a whole number between 1 and 50.');
  }
  return n;
}

export function parseSearchQuery(value) {
  if (typeof value !== 'string') {
    throw new AppError(400, 'INVALID_QUERY', 'Enter a keyword to search, for example ?q=wimbledon.');
  }
  const q = value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
  if (q.length < 2) throw new AppError(400, 'INVALID_QUERY', 'Search keywords must be at least 2 characters.');
  if (q.length > 100) throw new AppError(400, 'INVALID_QUERY', 'Search keywords must be 100 characters or fewer.');
  return q;
}

export function parseCategory(value) {
  const slug = String(value || '').toLowerCase();
  if (!isValidCategory(slug)) {
    throw new AppError(404, 'UNKNOWN_CATEGORY', `"${slug.slice(0, 40)}" is not a Sportsphere category.`);
  }
  return slug;
}

export function parseArticleId(value) {
  if (!/^[a-f0-9]{40}$/i.test(String(value || ''))) {
    throw new AppError(400, 'INVALID_ARTICLE_ID', 'Article ids are 40-character hex strings.');
  }
  return value.toLowerCase();
}
