// Mirrors backend/src/utils/categories.js (slug + display name). Kept static so navigation renders instantly.
export const CATEGORIES = [
  { slug: 'cricket', name: 'Cricket' },
  { slug: 'football', name: 'Football' },
  { slug: 'basketball', name: 'Basketball' },
  { slug: 'tennis', name: 'Tennis' },
  { slug: 'badminton', name: 'Badminton' },
  { slug: 'hockey', name: 'Hockey' },
  { slug: 'formula-1', name: 'Formula 1' },
  { slug: 'volleyball', name: 'Volleyball' },
  { slug: 'kabaddi', name: 'Kabaddi' },
  { slug: 'other', name: 'Other sports' },
];

const BY_SLUG = Object.fromEntries(CATEGORIES.map((c) => [c.slug, c]));
export const getCategory = (slug) => BY_SLUG[slug];
export const categoryName = (slug) => BY_SLUG[slug]?.name || 'Sports';

export const POPULAR_SEARCHES = ['IPL', 'Premier League', 'NBA', 'Wimbledon', 'Formula 1', 'Pro Kabaddi', 'Olympics'];
