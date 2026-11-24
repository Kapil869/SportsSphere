const dateFormat = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
const timeFormat = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });

/** "12 min ago", "5 hr ago" for the last day, otherwise "20 Nov 2026". */
export function formatPublished(iso, now = Date.now()) {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const diff = now - t;
  if (diff < 0 || diff >= 86400000) return dateFormat.format(t);
  const mins = Math.max(1, Math.round(diff / 60000));
  return mins < 60 ? `${mins} min ago` : `${Math.round(mins / 60)} hr ago`;
}

export const formatFull = (iso) => {
  const t = new Date(iso);
  return Number.isNaN(t.getTime()) ? '' : `${dateFormat.format(t)}, ${timeFormat.format(t)}`;
};
