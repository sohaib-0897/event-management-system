import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { toggleFavorite } from './favoritesSlice';

export function FavoriteButton({ event, compact = false }) {
  const dispatch = useDispatch(); const navigate = useNavigate();
  const userId = useSelector((s) => s.auth.currentUserId);
  const saved = useSelector((s) => Boolean(s.favorites.byUserId[userId]?.[event.id]));
  function toggle() {
    if (!userId) return navigate('/login', { state: { from: `/events/${encodeURIComponent(event.id)}` } });
    dispatch(toggleFavorite(event));
  }
  return <button className={compact ? 'favorite-button' : 'button secondary w-full favorite-detail'} aria-label={`${saved ? 'Remove' : 'Save'} ${event.name} ${saved ? 'from' : 'to'} favorites`} aria-pressed={saved} onClick={toggle}><Heart size={compact ? 17 : 16} fill={saved ? 'currentColor' : 'none'} />{!compact && (saved ? 'Saved to favorites' : 'Save to favorites')}</button>;
}
