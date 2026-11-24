import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function SearchBar({ onSubmitted }) {
  const [params] = useSearchParams();
  const urlQuery = params.get('q') || '';
  const [value, setValue] = useState(urlQuery);
  const navigate = useNavigate();

  useEffect(() => setValue(urlQuery), [urlQuery]);

  const submit = (e) => {
    e.preventDefault();
    const q = value.trim();
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
    onSubmitted?.();
  };

  return (
    <form className="search" role="search" onSubmit={submit}>
      <label htmlFor="site-search" className="sr-only">Search sports news</label>
      <input
        id="site-search"
        className="search__input"
        type="search"
        placeholder="Search teams, players, tournaments"
        value={value}
        maxLength={100}
        onChange={(e) => setValue(e.target.value)}
        autoComplete="off"
      />
      <button className="search__btn" type="submit" aria-label="Search">
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="m16 16 4.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </form>
  );
}
