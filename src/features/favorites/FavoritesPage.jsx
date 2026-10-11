import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { EventCard } from '../events/EventCard';
import { Empty } from '../../components/ui/States';

export function FavoritesPage() {
  const userId = useSelector((s) => s.auth.currentUserId);
  const favorites = useSelector((s) => s.favorites.byUserId[userId]);
  const entities = useSelector((s) => s.events.entitiesById);
  const events = Object.values(favorites || {}).sort((a, b) => (b.savedAt || '').localeCompare(a.savedAt || '')).map((entry) => entities[entry.eventSnapshot.id] || entry.eventSnapshot);
  return <div className="page"><p className="eyebrow">KEEP THE GOOD ONES CLOSE</p><h1>A little inspiration.<br /><em>Saved for later.</em></h1><p className="lead">Your personal shortlist of experiences worth showing up for.</p><div className="favorites-content">{events.length ? <div className="event-grid">{events.map((event) => <EventCard key={event.id} event={event} />)}</div> : <Empty title="Something will catch your eye">Tap the heart on any event to save it here.<br /><Link className="text-link" to="/events">Explore events ↗</Link></Empty>}</div></div>;
}
