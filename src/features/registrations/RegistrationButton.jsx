import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { Check, CalendarPlus } from 'lucide-react';
import { cancelRegistration, registerForEvent } from './registrationsSlice';
import { isCompleted } from '../../utils/dates';

export function RegistrationButton({ event }) {
  const dispatch = useDispatch(); const navigate = useNavigate(); const location = useLocation();
  const userId = useSelector((s) => s.auth.currentUserId);
  const registered = useSelector((s) => Boolean(s.registrations.byUserId[userId]?.[event.id]));
  const [message, setMessage] = useState('');
  const unavailable = event.status === 'cancelled' || isCompleted(event);
  function register() {
    if (!userId) return navigate('/login', { state: { from: location.pathname + location.search } });
    const result = dispatch(registerForEvent(event)); setMessage(result.ok ? 'Added to My Events.' : result.error);
  }
  return <div className="registration-action">{registered ? <><p className="registered-label"><Check size={15} />You’re registered</p><button className="button secondary w-full" onClick={() => { dispatch(cancelRegistration(event.id)); setMessage('Registration cancelled.'); }}>Cancel registration</button></> : <button className="button w-full" onClick={register} disabled={unavailable}><CalendarPlus size={16} />{unavailable ? 'Registration unavailable' : 'Register for event'}</button>}{message && <p className="inline-message" role="status">{message}</p>}<p className="demo-note">Registration saves this event to your calendar in this browser. It does not reserve a ticket.</p></div>;
}
