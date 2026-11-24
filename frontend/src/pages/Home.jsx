import { getHome } from '../api/news.js';
import { useFetch } from '../hooks/useFetch.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import FeaturedStory from '../components/FeaturedStory.jsx';
import TrendingList from '../components/TrendingList.jsx';
import ArticleGrid from '../components/ArticleGrid.jsx';
import CategorySection from '../components/CategorySection.jsx';
import { ErrorState, HomeSkeleton, Notice } from '../components/States.jsx';

export default function Home() {
  useDocumentTitle('');
  const { data, error, loading, reload } = useFetch((signal) => getHome(signal), []);

  if (loading) return <HomeSkeleton />;
  if (error) {
    return (
      <div className="container">
        <ErrorState error={error} onRetry={reload} />
      </div>
    );
  }

  const { featured, trending, latest, sections, meta } = data;
  return (
    <div className="container">
      {meta.stale && (
        <Notice>Live updates are paused, so you are seeing the most recent stories we saved earlier.</Notice>
      )}
      <div className="hero">
        <FeaturedStory article={featured} />
        {trending.length > 0 && <TrendingList articles={trending} />}
      </div>

      {latest.length > 0 && (
        <section className="section" aria-labelledby="latest-h">
          <div className="section__head">
            <h2 id="latest-h" className="section__title">Latest stories</h2>
          </div>
          <ArticleGrid articles={latest} />
        </section>
      )}

      {sections.map((s) => (
        <CategorySection key={s.slug} slug={s.slug} name={s.name} articles={s.articles} />
      ))}
    </div>
  );
}
