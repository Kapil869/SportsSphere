import * as news from '../services/newsService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { parseArticleId, parseCategory, parsePage, parseSearchQuery } from '../utils/validators.js';

export const getCategories = asyncHandler(async (req, res) => {
  res.json({ categories: await news.listCategories() });
});

export const getHome = asyncHandler(async (req, res) => {
  res.json(await news.getHome());
});

export const getByCategory = asyncHandler(async (req, res) => {
  const slug = parseCategory(req.params.slug);
  const page = parsePage(req.query.page);
  res.json(await news.getCategoryNews(slug, page));
});

export const search = asyncHandler(async (req, res) => {
  const q = parseSearchQuery(req.query.q);
  const page = parsePage(req.query.page);
  res.json(await news.searchNews(q, page));
});

export const getArticle = asyncHandler(async (req, res) => {
  res.json(await news.getArticle(parseArticleId(req.params.id)));
});
