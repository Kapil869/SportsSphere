import { Link, useParams } from 'react-router-dom';
import { getArticle } from '../api/news.js';
import { useFetch } from '../hooks/useFetch.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { categoryName } from '../data/categories.js';
import { formatFull } from '../utils/format.js';
import SafeImage from '../components/SafeImage.jsx';
import ArticleGrid from '../components/ArticleGrid.jsx';
import { ErrorState, Spinner } from '../components/States.jsx';

export default function ArticleDetail() {
  const { id } = useParams();
  const { data, error, loading, reload } = useFetch((signal) => getArticle(id, signal), [id]);
  useDocumentTitle(data?.article.title);

  if (loading) return <div className="container page"><Spinner label="Loading story" /></div>;
  if (error) {
    return (
      <div className="container page">
        <ErrorState
          error={error}
          title={error.status === 404 ? 'Story not found' : "We couldn't load this story"}
          onRetry={error.status === 404 ? undefined : reload}
        />
        <p className="state__links"><Link className="btn" to="/">Back to the homepage</Link></p>
      </div>
    );
  }

  const { article, related } = data;
  const sourceName = article.source.name;
  // Only show the provider's excerpt when it adds something beyond the description. It is never presented as the full story.
  const excerpt = article.contentSnippet;
  const showExcerpt = excerpt && excerpt.slice(0, 40) !== article.description.slice(0, 40);

  return (
    <div className="container page">
      <article className="story">
        <Link to={`/category/${article.category}`} className="chip chip--solid">{categoryName(article.category)}</Link>
        <h1 className="story__title">{article.title}</h1>
        <p className="card__meta">
          <span className="card__source">{sourceName}</span>
          <time dateTime={article.publishedAt}>{formatFull(article.publishedAt)}</time>
        </p>
        <div className="story__media"><SafeImage src={article.image} category={article.category} priority /></div>

        {article.description && <p className="story__lede">{article.description}</p>}
        {showExcerpt && (
          <blockquote className="story__excerpt">
            <p>{excerpt}</p>
            <footer>Excerpt provided by {sourceName}</footer>
          </blockquote>
        )}

        <div className="story__cta">
          <a className="btn btn--primary" href={article.url} target="_blank" rel="noopener noreferrer">
            Read the full story on {sourceName}
          </a>
          <p className="story__note">
            Sportsphere shows headlines and short excerpts. The complete article is published by {sourceName}.
          </p>
        </div>
      </article>

      {related.length > 0 && (
        <section className="section" aria-labelledby="related-h">
          <div className="section__head">
            <h2 id="related-h" className="section__title">More {categoryName(article.category)} news</h2>
            <Link to={`/category/${article.category}`} className="section__all">View all</Link>
          </div>
          <ArticleGrid articles={related} />
        </section>
      )}
    </div>
  );
}
