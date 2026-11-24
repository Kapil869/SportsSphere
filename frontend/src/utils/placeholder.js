import { categoryName } from '../data/categories.js';

/** Branded fallback image (inline SVG data URI) used when a story has no picture or the picture fails to load. */
export function placeholderImage(category) {
  const label = categoryName(category);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" preserveAspectRatio="xMidYMid slice">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#16295a"/><stop offset="1" stop-color="#071226"/></linearGradient></defs>
<rect width="640" height="360" fill="url(#g)"/>
<g transform="translate(320 150)" opacity=".9"><circle r="52" fill="#fff" opacity=".1"/><path d="M-46 -12c30 12 62 12 92 0M-46 14c30-12 62-12 92 0" stroke="#fff" stroke-opacity=".35" stroke-width="3" fill="none"/><ellipse rx="86" ry="28" transform="rotate(-24)" fill="none" stroke="#E4202D" stroke-width="6"/></g>
<text x="320" y="268" text-anchor="middle" font-family="Arial Narrow,Arial,sans-serif" font-size="30" font-weight="700" fill="#fff" opacity=".85">${label}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
