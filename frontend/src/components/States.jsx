export function Spinner({ label = 'Loading' }) {
  return (
    <div className="state state--loading" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorState({ error, onRetry, title = "We couldn't load the news" }) {
  return (
    <div className="state state--error" role="alert">
      <h2 className="state__title">{title}</h2>
      <p className="state__text">{error?.message || 'Something went wrong. Try again.'}</p>
      {onRetry && (
        <button type="button" className="btn" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, children, action }) {
  return (
    <div className="state">
      <h2 className="state__title">{title}</h2>
      {children && <p className="state__text">{children}</p>}
      {action}
    </div>
  );
}

export function Notice({ children }) {
  return (
    <p className="notice" role="status">
      {children}
    </p>
  );
}

export function SkeletonGrid({ count = 6 }) {
  return (
    <div className="grid" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div className="skel-card" key={i}>
          <div className="skel skel--img" />
          <div className="skel skel--line" />
          <div className="skel skel--line skel--short" />
        </div>
      ))}
    </div>
  );
}

export function HomeSkeleton() {
  return (
    <div className="container" role="status" aria-label="Loading the latest stories">
      <div className="hero" aria-hidden="true">
        <div className="skel skel--hero" />
        <div className="skel skel--panel" />
      </div>
      <SkeletonGrid />
    </div>
  );
}
