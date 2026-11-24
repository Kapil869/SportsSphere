import { http } from './client.js';

const get = (url, params, signal) => http.get(url, { params, signal }).then((r) => r.data);

export const getHome = (signal) => get('/news/home', undefined, signal);
export const getCategoryNews = (slug, page, signal) => get(`/news/category/${slug}`, { page }, signal);
export const searchNews = (q, page, signal) => get('/news/search', { q, page }, signal);
export const getArticle = (id, signal) => get(`/news/article/${id}`, undefined, signal);
