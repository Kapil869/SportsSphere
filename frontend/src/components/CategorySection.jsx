import { Link } from 'react-router-dom';
import NewsCard from './NewsCard.jsx';

export default function CategorySection({ slug, name, articles }) {
  const [lead, ...rest] = articles;
  if (!lead) return null;
  return (
    <section className="section" aria-labelledby={`sec-${slug}`}>
      <div className="section__head">
        <h2 id={`sec-${slug}`} className="section__title">{name}</h2>
        <Link to={`/category/${slug}`} className="section__all">View all {name} news</Link>
      </div>
      <div className="split">
        <NewsCard article={lead} variant="lead" />
        <div className="split__list">
          {rest.slice(0, 3).map((a) => <NewsCard key={a.id} article={a} variant="compact" />)}
        </div>
      </div>
    </section>
  );
}
