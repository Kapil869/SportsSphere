import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import Logo from './Logo.jsx';
import SearchBar from './SearchBar.jsx';
import { CATEGORIES } from '../data/categories.js';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname, location.search]);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header className="header">
      <div className="header__top container">
        <Logo />
        <p className="header__tagline">Every Sport. Every Story. One Universe.</p>
        <div className="header__search">
          <SearchBar />
        </div>
        <button
          type="button"
          className="burger"
          aria-expanded={open}
          aria-controls="sport-nav"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((o) => !o)}
        >
          <span /><span /><span />
        </button>
      </div>
      <nav id="sport-nav" className={`nav ${open ? 'nav--open' : ''}`} aria-label="Sports">
        <ul className="nav__list container">
          <li><NavLink to="/" end className="nav__link">Home</NavLink></li>
          {CATEGORIES.map((c) => (
            <li key={c.slug}>
              <NavLink to={`/category/${c.slug}`} className="nav__link">{c.name}</NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
