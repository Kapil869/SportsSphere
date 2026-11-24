import { Link } from 'react-router-dom';
import SafeImage from './SafeImage.jsx';
import { categoryName } from '../data/categories.js';
import { formatPublished } from '../utils/format.js';

/** variant: "default" (grid), "lead" (large), "compact" (image beside text) */
export default function NewsCard({ article, variant = 'default' }) {
  const to = `/article/${article.id}`;
  return (
    <article className={`card card--${variant}`}>
      <div className="card__media">
        <SafeImage src={article.image} category={article.category} />
      </div>
      <div className="card__body">
        <Link to={`/category/${article.category}`} className="chip">
          {categoryName(article.category)}
        </Link>
        <h3 className="card__title">
          <Link to={to} className="card__link">{article.title}</Link>
        </h3>
        {article.description && <p className="card__desc">{article.description}</p>}
        <p className="card__meta">
          <span className="card__source">{article.source.name}</span>
          <time dateTime={article.publishedAt}>{formatPublished(article.publishedAt)}</time>
        </p>
        <Link to={to} className="card__more" aria-label={`Read more: ${article.title}`}>Read more</Link>
      </div>
    </article>
  );
}
