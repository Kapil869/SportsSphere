import { Link } from 'react-router-dom';
import { formatPublished } from '../utils/format.js';

/** Ranked list: the numbers are the order the news provider ranks these headlines. */
export default function TrendingList({ articles }) {
  return (
    <aside className="trending" aria-labelledby="trending-h">
      <h2 id="trending-h" className="trending__h">Trending now</h2>
      <ol className="trending__list">
        {articles.map((a, i) => (
          <li key={a.id} className="trending__item">
            <span className="trending__rank" aria-hidden="true">{i + 1}</span>
            <div>
              <Link to={`/article/${a.id}`} className="trending__title">{a.title}</Link>
              <p className="card__meta card__meta--light">
                <span className="card__source">{a.source.name}</span>
                <time dateTime={a.publishedAt}>{formatPublished(a.publishedAt)}</time>
              </p>
            </div>
          </li>
        ))}
      </ol>
    </aside>
  );
}
