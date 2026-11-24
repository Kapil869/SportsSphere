import { Link } from 'react-router-dom';

export function LogoMark({ size = 36 }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true" focusable="false">
      <circle cx="20" cy="20" r="13" fill="#fff" />
      <path d="M7.5 16.5c8 3 17 3 25 0M7.5 23.5c8-3 17-3 25 0" stroke="#071226" strokeWidth="1.8" fill="none" />
      <ellipse cx="20" cy="20" rx="19" ry="6.5" transform="rotate(-24 20 20)" fill="none" stroke="#E4202D" strokeWidth="2.6" />
    </svg>
  );
}

export default function Logo() {
  return (
    <Link to="/" className="logo" aria-label="Sportsphere home">
      <LogoMark />
      <span className="logo__word">Sportsphere</span>
    </Link>
  );
}
