import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Returns to the top when the page (not just the query string) changes. */
export default function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
