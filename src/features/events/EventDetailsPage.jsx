import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, CalendarDays, MapPin, Clock } from 'lucide-react';
import { fetchEventDetails } from './eventsSlice';
import { dateLabel, priceLabel } from '../../utils/dates';
import { Loading, ErrorState } from '../../components/ui/States';
import { RegistrationButton } from '../registrations/RegistrationButton';

export function EventDetailsPage() {
  const { eventId } = useParams(); const dispatch = useDispatch();
  const entry = useSelector((s) => s.events.detailsById[eventId]);
  const event = useSelector((s) => s.events.entitiesById[eventId]);
  useEffect(() => {
    let task;
    const timer = setTimeout(() => { task = dispatch(fetchEventDetails({ id: eventId })); }, 0);
    return () => { clearTimeout(timer); task?.abort(); };
  }, [eventId, dispatch]);
  return <div className="page detail-page"><Link className="back-link" to="/events"><ArrowLeft size={15} />Back to discovery</Link>{(!entry || ['idle', 'loading'].includes(entry.status)) && <Loading message="Getting the details…" />}{entry?.status === 'error' && <ErrorState message={entry.error} retry={() => dispatch(fetchEventDetails({ id: eventId, force: true }))} />}{entry?.status === 'success' && event && <><div className="detail-banner"><img src={event.image} alt={event.name} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/event-placeholder.svg'; }} /><span className="category-badge">{event.category}</span></div>{event.imageAttribution && <p className="image-credit">{event.imageAttribution}</p>}<div className="detail-grid"><section><p className="eyebrow">{event.genre || event.category} · LIVE EXPERIENCE</p><h1>{event.name}</h1><div className="detail-facts"><p><CalendarDays size={18} />{dateLabel(event)}</p><p><Clock size={18} />{event.localTime ? event.localTime.slice(0, 5) : 'Time to be announced'}{event.timezone ? ` · ${event.timezone}` : ''}</p><p><MapPin size={18} />{event.venue}{event.city ? `, ${event.city}` : ''}</p></div>{event.status !== 'unknown' && <p className="event-status">Status: {event.status === 'onsale' ? 'On sale' : event.status}</p>}<div className="detail-copy"><h2>About this experience</h2><p>{event.description || 'Find more information about this experience on the event’s Ticketmaster page.'}</p>{event.note && <><h3>Before you go</h3><p>{event.note}</p></>}{event.address && <><h3>Getting there</h3><p>{event.address}</p></>}</div></section><aside className="booking-panel"><p className="eyebrow">A MOMENT WORTH MAKING</p><h2>{priceLabel(event)}</h2><p className="muted">Ticket prices and availability are confirmed on Ticketmaster.</p>{event.ticketUrl ? <a className="button primary w-full" href={event.ticketUrl} target="_blank" rel="noopener noreferrer">Tickets on Ticketmaster<ArrowUpRight size={17} /></a> : <p className="inline-message">A ticket purchase link is currently unavailable.</p>}<p className="demo-note">Ticket purchases take place on Ticketmaster.</p><RegistrationButton event={event} /></aside></div></>}</div>;
}
