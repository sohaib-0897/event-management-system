import { ChevronLeft, ChevronRight } from 'lucide-react';

export function Pagination({ page, totalPages, onChange }) {
  const pages = Math.min(50, Math.max(0, totalPages));
  if (!pages) return null;
  return <><nav className="pagination" aria-label="Results pagination"><button className="button secondary" disabled={page <= 0} onClick={() => onChange(page - 1)} aria-label="Previous page"><ChevronLeft size={16} />Previous</button><span aria-live="polite">Page {page + 1} of {pages}</span><button className="button secondary" disabled={page >= pages - 1} onClick={() => onChange(page + 1)} aria-label="Next page">Next<ChevronRight size={16} /></button></nav>{totalPages > 50 && <p className="pagination-note">Showing the first 1,000 results. Narrow your filters to explore more specific events.</p>}</>;
}
