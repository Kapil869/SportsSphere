import { Link, useSearchParams } from 'react-router-dom';
import { searchNews } from '../api/news.js';
import { usePagedNews } from '../hooks/usePagedNews.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { POPULAR_SEARCHES } from '../data/categories.js';
import NewsList from './NewsList.jsx';

export default function Search() {
  const [params] = useSearchParams();
  const q = (params.get('q') || '').trim();
  useDocumentTitle(q ? `Search: ${q}` : 'Search');

  const tooShort = q.length > 0 && q.length < 2;
  const active = q.length >= 2;
  const list = usePagedNews(
    (page, signal) => (active ? searchNews(q, page, signal) : Promise.resolve({ articles: [], meta: {} })),
    [q],
  );

  if (!active) {
    return (
      <div className="container page">
        <header className="page__head">
          <h1 className="page__title">Search</h1>
          <p className="page__sub">
            {tooShort ? 'Type at least 2 characters to search.' : 'Search for a team, player, tournament or story.'}
          </p>
        </header>
        <p className="chips-label" id="popular-h">Popular searches</p>
        <ul className="chips" aria-labelledby="popular-h">
          {POPULAR_SEARCHES.map((term) => (
            <li key={term}><Link className="chip-btn" to={`/search?q=${encodeURIComponent(term)}`}>{term}</Link></li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="container page">
      <header className="page__head">
        <h1 className="page__title">Results for “{q}”</h1>
        {!list.loading && !list.error && list.articles.length > 0 && (
          <p className="page__sub">Showing {list.articles.length} {list.articles.length === 1 ? 'story' : 'stories'}</p>
        )}
      </header>
      <NewsList
        list={list}
        emptyTitle={`No stories found for “${q}”`}
        emptyText="Check the spelling, try a broader keyword, or pick a sport from the menu."
        emptyAction={<Link className="btn" to="/search">Try another search</Link>}
      />
    </div>
  );
}
