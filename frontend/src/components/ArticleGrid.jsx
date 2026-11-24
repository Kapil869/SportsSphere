import NewsCard from './NewsCard.jsx';

export default function ArticleGrid({ articles }) {
  return (
    <div className="grid">
      {articles.map((a) => (
        <NewsCard key={a.id} article={a} />
      ))}
    </div>
  );
}
