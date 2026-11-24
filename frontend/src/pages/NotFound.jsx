import { Link } from 'react-router-dom';
import { EmptyState } from '../components/States.jsx';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';

export default function NotFound() {
  useDocumentTitle('Page not found');
  return (
    <div className="container page">
      <EmptyState
        title="We can't find that page"
        action={<Link className="btn" to="/">Go to the homepage</Link>}
      >
        The link may be out of date, or the sport doesn't exist on Sportsphere.
      </EmptyState>
    </div>
  );
}
