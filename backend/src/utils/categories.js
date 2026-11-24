/**
 * The ten Sportsphere sections.
 * - `query` is the GNews search expression used to fetch the section.
 * - `pattern` classifies any article's title + description, so stored articles get tagged
 *   with every sport they mention (used by the archive, related stories and filtering).
 */
export const CATEGORIES = [
  { slug: 'cricket', name: 'Cricket', query: 'cricket', pattern: /\b(cricket|IPL|T20|ODI|wicket|batsman|bowler)\b/i },
  { slug: 'football', name: 'Football', query: 'football OR soccer', pattern: /\b(football|soccer|premier league|la liga|serie a|bundesliga|champions league|FIFA|UEFA)\b/i },
  { slug: 'basketball', name: 'Basketball', query: 'basketball OR NBA', pattern: /\b(basketball|NBA|WNBA|EuroLeague)\b/i },
  { slug: 'tennis', name: 'Tennis', query: 'tennis', pattern: /\b(tennis|ATP|WTA|Wimbledon|Roland Garros|Grand Slam)\b/i },
  { slug: 'badminton', name: 'Badminton', query: 'badminton', pattern: /\b(badminton|BWF|shuttler)\b/i },
  { slug: 'hockey', name: 'Hockey', query: 'hockey', pattern: /\b(hockey|NHL|FIH|puck)\b/i },
  { slug: 'formula-1', name: 'Formula 1', query: '"Formula 1" OR F1 OR "Grand Prix"', pattern: /\b(formula\s?(1|one)|F1|grand prix)\b/i },
  { slug: 'volleyball', name: 'Volleyball', query: 'volleyball', pattern: /\b(volleyball|VNL)\b/i },
  { slug: 'kabaddi', name: 'Kabaddi', query: 'kabaddi', pattern: /\b(kabaddi|PKL)\b/i },
  {
    slug: 'other',
    name: 'Other sports',
    query: 'Olympics OR golf OR boxing OR rugby OR athletics OR swimming OR wrestling',
    pattern: /\b(olympics|olympic|golf|boxing|rugby|athletics|swimming|wrestling|cycling|marathon)\b/i,
  },
];

const BY_SLUG = new Map(CATEGORIES.map((c) => [c.slug, c]));

export const getCategory = (slug) => BY_SLUG.get(slug);
export const isValidCategory = (slug) => BY_SLUG.has(slug);

/** Slugs of every sport mentioned in `text`; ['other'] when nothing matches. */
export function detectCategories(text = '') {
  const found = CATEGORIES.filter((c) => c.pattern.test(text)).map((c) => c.slug);
  return found.length ? found : ['other'];
}

/** Returns copies of `articles` carrying `category` and `categories`. `forced` slugs always win. */
export function tagArticles(articles, forced = []) {
  return articles.map((a) => {
    const categories = [...new Set([...forced, ...detectCategories(`${a.title} ${a.description}`)])];
    return { ...a, categories, category: forced[0] || categories[0] };
  });
}
