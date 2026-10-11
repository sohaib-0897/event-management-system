import { Link } from 'react-router-dom';
import { ArrowUpRight, MapPin, CalendarDays } from 'lucide-react';
import { dateLabel, priceLabel } from '../../utils/dates';
import { FavoriteButton } from '../favorites/FavoriteButton';

export function EventCard({ event, children }) {
  return (
    <article className="event-card">
      <div className="event-image">
        <Link to={`/events/${encodeURIComponent(event.id)}`} tabIndex={-1} aria-hidden="true">
          <img
            src={event.image}
            alt=""
            loading="lazy"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = '/event-placeholder.svg';
            }}
          />
        </Link>
        <FavoriteButton event={event} compact />
        <span className="category-badge">{event.category}</span>
        {event.status === 'cancelled' && <span className="status-badge">Cancelled</span>}
      </div>
      <div className="event-body">
        <p className="event-date">
          <CalendarDays size={13} />
          {dateLabel(event)}
        </p>
        <h3>
          <Link to={`/events/${encodeURIComponent(event.id)}`}>{event.name}</Link>
        </h3>
        <p className="event-location">
          <MapPin size={13} />
          <span>
            {event.venue}
            {event.city ? ` · ${event.city}` : ''}
          </span>
        </p>
        <div className="event-bottom">
          <span>{priceLabel(event)}</span>
          <Link
            to={`/events/${encodeURIComponent(event.id)}`}
            className="card-arrow"
            aria-label={`View ${event.name}`}
          >
            <ArrowUpRight size={18} />
          </Link>
        </div>
        {children}
      </div>
    </article>
  );
}
