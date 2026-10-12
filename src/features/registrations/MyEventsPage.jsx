import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { EventCard } from '../events/EventCard';
import { Empty } from '../../components/ui/States';
import { isCompleted } from '../../utils/dates';
import { cancelRegistration } from './registrationsSlice';

export function MyEventsPage() {
  const dispatch = useDispatch();
  const [params, setParams] = useSearchParams();
  const completed = params.get('tab') === 'completed';
  const userId = useSelector((s) => s.auth.currentUserId);
  const registrations = useSelector((s) => s.registrations.byUserId[userId]);
  const entities = useSelector((s) => s.events.entitiesById);
  const [now, setNow] = useState(Date.now());
  const [message, setMessage] = useState('');
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);
  const all = Object.values(registrations || {}).map(
    (entry) => entities[entry.eventSnapshot.id] || entry.eventSnapshot,
  );
  const upcoming = all.filter((event) => !isCompleted(event, now));
  const past = all.filter((event) => isCompleted(event, now));
  const shown = [...(completed ? past : upcoming)].sort(
    (a, b) => (a.localDate || '9999').localeCompare(b.localDate || '9999') * (completed ? -1 : 1),
  );
  return (
    <div className="page">
      <div className="collection-heading">
        <div>
          <p className="eyebrow">MAKE ROOM FOR GOOD TIMES</p>
          <h1>
            Your plans.
            <br />
            <em>All in one place.</em>
          </h1>
          <p className="lead">The experiences you’ve saved a place for.</p>
        </div>
        <Link className="button secondary" to="/events">
          Discover more
          <ArrowUpRight size={16} />
        </Link>
      </div>
      <div className="collection-tabs" role="group" aria-label="My Events tabs">
        <button
          className={!completed ? 'active' : ''}
          aria-pressed={!completed}
          onClick={() => setParams({ tab: 'upcoming' })}
        >
          Upcoming <span>{upcoming.length}</span>
        </button>
        <button
          className={completed ? 'active' : ''}
          aria-pressed={completed}
          onClick={() => setParams({ tab: 'completed' })}
        >
          Completed <span>{past.length}</span>
        </button>
      </div>
      {message && (
        <p className="inline-message" role="status">
          {message}
        </p>
      )}
      {shown.length ? (
        <div className="event-grid">
          {shown.map((event) => (
            <EventCard key={event.id} event={event}>
              <div className="saved-card-action">
                <span>
                  {event.datePending || !event.localDate
                    ? 'Date pending'
                    : completed
                      ? 'Completed'
                      : 'Registered'}
                </span>
                {!completed && (
                  <button
                    className="text-link"
                    onClick={() => {
                      const result = dispatch(cancelRegistration(event.id));
                      setMessage(
                        result.ok ? `Registration for ${event.name} cancelled.` : result.error,
                      );
                    }}
                  >
                    Cancel registration
                  </button>
                )}
              </div>
            </EventCard>
          ))}
        </div>
      ) : (
        <Empty
          title={
            completed ? 'Your memories start here' : 'Your calendar has room for something great'
          }
        >
          {completed
            ? 'Events move here after they finish.'
            : 'Explore events and register for the ones you don’t want to miss.'}
          <br />
          <Link className="text-link" to="/events">
            Explore events ↗
          </Link>
        </Empty>
      )}
    </div>
  );
}
