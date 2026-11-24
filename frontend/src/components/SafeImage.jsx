import { useEffect, useState } from 'react';
import { placeholderImage } from '../utils/placeholder.js';

/** <img> that swaps to a branded placeholder when the source is missing or fails to load. */
export default function SafeImage({ src, alt = '', category, className = '', priority = false }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  const useFallback = failed || !src;
  return (
    <img
      className={`img ${useFallback ? 'img--fallback' : ''} ${className}`}
      src={useFallback ? placeholderImage(category) : src}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}
