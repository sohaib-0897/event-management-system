import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { ArrowUpRight, Search, SlidersHorizontal, MapPin } from 'lucide-react';
import { fetchCategories, fetchEvents } from './eventsSlice';
import { queryKey, validFilters } from '../../services/ticketmaster/query';
import { EventCard } from './EventCard';
import { Loading, Empty, ErrorState } from '../../components/ui/States';

export function EventsPage() {
  const dispatch = useDispatch(); const [params, setParams] = useSearchParams();
  const filters = validFilters(Object.fromEntries(params)); const key = queryKey(filters);
  const [keyword, setKeyword] = useState(filters.keyword); const [showFilters, setShowFilters] = useState(false);
  const entry = useSelector((s) => s.events.queriesByKey[key]);
  const entities = useSelector((s) => s.events.entitiesById);
  const categories = useSelector((s) => s.events.classifications);
  function update(patch) {
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      for (const [name, value] of Object.entries(patch)) value ? next.set(name, value) : next.delete(name);
      next.delete('page'); return next;
    });
  }
  useEffect(() => { setKeyword(filters.keyword); }, [filters.keyword]);
  useEffect(() => {
    if (keyword.trim() === filters.keyword) return;
    const timer = setTimeout(() => update({ keyword: keyword.trim() }), 350);
    return () => clearTimeout(timer);
  }, [keyword, filters.keyword]);
  useEffect(() => {
    let task;
    const timer = setTimeout(() => { task = dispatch(fetchEvents({ filters: JSON.parse(key) })); }, 0);
    return () => { clearTimeout(timer); task?.abort(); };
  }, [dispatch, key]);
  useEffect(() => {
    const timer = setTimeout(() => dispatch(fetchCategories()), 0);
    return () => clearTimeout(timer);
  }, [dispatch]);
  const events = (entry?.ids || []).map((id) => entities[id]).filter(Boolean);
  return <div className="page discovery-page"><section className="discovery-hero"><div><p className="eyebrow">LESS SCROLLING. MORE LIVING.</p><h1>Find your next<br /><em>great experience.</em></h1><p className="lead">From front-row moments to unexpected discoveries.<br className="desktop-break" /> Get out there. Your people are waiting.</p><div className="hero-note"><span className="note-dot" />Live music · Sports · Arts & more</div></div><div className="hero-art" aria-hidden="true"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="hero-ticket"><span className="ticket-label">ADMIT ONE · GOOD TIMES AHEAD</span><strong>MAKE<br />A NIGHT<br /><em>of it.</em></strong><ArrowUpRight size={40} strokeWidth={1.5} /><div className="ticket-bottom"><span>YOUR NEXT MEMORY</span><span className="barcode">|||| ||| || |||| |||</span></div></div><span className="hero-spark">✳</span><span className="art-caption">Life happens out there.</span></div></section><section aria-label="Event search"><div className="search-bar"><Search size={20} /><input aria-label="Search events" placeholder="Artist, event, or a little inspiration…" value={keyword} onChange={(e) => setKeyword(e.target.value)} /><span className="search-divider" /><MapPin size={18} /><input className="city-input" aria-label="City" placeholder="Any city" value={filters.city} onChange={(e) => update({ city: e.target.value })} /><button className="filter-button" aria-expanded={showFilters} onClick={() => setShowFilters(!showFilters)}><SlidersHorizontal size={17} /><span>Filters</span></button></div>{showFilters && <div className="filter-panel"><label className="field">Country<select value={filters.country} onChange={(e) => update({ country: e.target.value })}><option value="">All countries</option>{[['US', 'United States'], ['CA', 'Canada'], ['GB', 'United Kingdom'], ['AU', 'Australia'], ['DE', 'Germany'], ['FR', 'France'], ['MX', 'Mexico'], ['NZ', 'New Zealand'], ['IE', 'Ireland']].map(([code, label]) => <option key={code} value={code}>{label}</option>)}</select></label><label className="field">From<input type="date" value={filters.from} onChange={(e) => update({ from: e.target.value })} /></label><label className="field">Through<input type="date" min={filters.from} value={filters.to} onChange={(e) => update({ to: e.target.value })} /></label><button className="text-link" onClick={() => { setKeyword(''); setParams({}); }}>Clear all filters</button></div>}<div className="category-row" aria-label="Event categories"><button className={`category-chip ${!filters.category ? 'selected' : ''}`} onClick={() => update({ category: '' })}>✦ All experiences</button>{categories.items.map((category) => <button key={category.id} className={`category-chip ${filters.category === category.id ? 'selected' : ''}`} onClick={() => update({ category: category.id })}>{category.name}</button>)}</div>{categories.status === 'error' && <p className="inline-message">{categories.error} <button className="text-link" onClick={() => dispatch(fetchCategories())}>Retry categories</button></p>}</section><section aria-labelledby="results-title"><div className="results-heading"><div><p className="eyebrow">GO WHERE THE GOOD TIMES ARE</p><h2 id="results-title">Explore events<span className="result-count">{entry?.status === 'success' ? `${entry.page.totalElements.toLocaleString()} experiences` : ''}</span></h2></div></div>{(!entry || ['idle', 'loading'].includes(entry.status)) && <Loading />}{entry?.status === 'error' && <ErrorState message={entry.error} retry={() => dispatch(fetchEvents({ filters, force: true }))} />}{entry?.status === 'success' && (events.length ? <div className="event-grid">{events.map((event) => <EventCard key={event.id} event={event} />)}</div> : <Empty title="No events found">Try a different city, category, or date range. Your next experience is still out there.</Empty>)}</section></div>;
}
