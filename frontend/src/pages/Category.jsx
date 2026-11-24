import { Link, useParams } from 'react-router-dom';
import { getCategoryNews } from '../api/news.js';
import { usePagedNews } from '../hooks/usePagedNews.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { getCategory } from '../data/categories.js';
import NewsList from './NewsList.jsx';
import NotFound from './NotFound.jsx';

export default function Category() {
  const { slug } = useParams();
  const category = getCategory(slug);
  useDocumentTitle(category?.name);

  const list = usePagedNews(
    (page, signal) => (category ? getCategoryNews(slug, page, signal) : Promise.resolve({ articles: [], meta: {} })),
    [slug],
  );

  if (!category) return <NotFound />;

  return (
    <div className="container page">
      <header className="page__head">
        <h1 className="page__title">{category.name}</h1>
        <p className="page__sub">The latest {category.name.toLowerCase()} news from publishers around the world.</p>
      </header>
      <NewsList
        list={list}
        emptyTitle={`No ${category.name.toLowerCase()} stories right now`}
        emptyText="New stories arrive throughout the day. Check back soon or browse another sport."
        emptyAction={<Link className="btn" to="/">Back to the homepage</Link>}
      />
    </div>
  );
}
