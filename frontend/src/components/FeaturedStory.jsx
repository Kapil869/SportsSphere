import { Link } from 'react-router-dom';
import SafeImage from './SafeImage.jsx';
import { categoryName } from '../data/categories.js';
import { formatPublished } from '../utils/format.js';

export default function FeaturedStory({ article }) {
  return (
    <article className="feature">
      <SafeImage src={article.image} category={article.category} priority className="feature__img" />
      <div className="feature__shade" />
      <div className="feature__text">
        <Link to={`/category/${article.category}`} className="chip chip--solid">{categoryName(article.category)}</Link>
        <h1 className="feature__title">
          <Link to={`/article/${article.id}`} className="card__link">{article.title}</Link>
        </h1>
        {article.description && <p className="feature__desc">{article.description}</p>}
        <p className="card__meta card__meta--light">
          <span className="card__source">{article.source.name}</span>
          <time dateTime={article.publishedAt}>{formatPublished(article.publishedAt)}</time>
        </p>
      </div>
    </article>
  );
}
