import { useEffect } from 'react';

export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | Sportsphere` : 'Sportsphere | Every Sport. Every Story. One Universe.';
  }, [title]);
}
