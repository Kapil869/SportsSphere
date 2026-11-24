import { Link } from 'react-router-dom';
import { LogoMark } from './Logo.jsx';
import { CATEGORIES } from '../data/categories.js';

export default function Footer() {
  const half = Math.ceil(CATEGORIES.length / 2);
  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div className="footer__brand">
          <div className="logo logo--static"><LogoMark size={34} /><span className="logo__word">Sportsphere</span></div>
          <p className="footer__tag">Every Sport. Every Story. One Universe.</p>
          <p className="footer__small">
            Headlines and excerpts come from news publishers through GNews. Each story links to the full article on the publisher's site.
          </p>
        </div>
        <nav aria-label="Sports, first group">
          <h2 className="footer__h">Sports</h2>
          <ul>{CATEGORIES.slice(0, half).map((c) => <li key={c.slug}><Link to={`/category/${c.slug}`}>{c.name}</Link></li>)}</ul>
        </nav>
        <nav aria-label="Sports, second group">
          <h2 className="footer__h">More sports</h2>
          <ul>{CATEGORIES.slice(half).map((c) => <li key={c.slug}><Link to={`/category/${c.slug}`}>{c.name}</Link></li>)}</ul>
        </nav>
        <nav aria-label="Explore">
          <h2 className="footer__h">Explore</h2>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/search">Search stories</Link></li>
            <li><a href="https://gnews.io" target="_blank" rel="noopener noreferrer">News data by GNews</a></li>
          </ul>
        </nav>
      </div>
      <div className="footer__bar container">
        <span>© {new Date().getFullYear()} Sportsphere. An independent news aggregator.</span>
      </div>
    </footer>
  );
}
