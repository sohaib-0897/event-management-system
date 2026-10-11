import { NavLink, Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../features/auth/authSlice';
import { hasStorageError } from '../../app/persistence';

export function Layout() {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.usersById[s.auth.currentUserId]);
  const persistenceError = useSelector(() => hasStorageError());
  return <><a className="skip-link" href="#main">Skip to content</a><header className="site-header"><NavLink to="/events" className="brand"><span className="brand-mark">g</span>gather<span className="brand-dot">.</span></NavLink><nav aria-label="Main navigation"><NavLink to="/events">Discover</NavLink><NavLink to="/my-events">My events</NavLink><NavLink to="/favorites">Favorites</NavLink></nav><div className="header-actions">{user ? <><span className="user-greeting">Hi, {user.name.split(' ')[0]}</span><button className="button secondary" onClick={() => dispatch(logout())}>Log out</button></> : <><NavLink to="/login" className="text-link">Log in</NavLink><NavLink to="/register" className="button primary">Get started ↗</NavLink></>}</div></header>{persistenceError && <p role="status" className="storage-warning">Browser storage is unavailable. Changes may not survive a refresh.</p>}<main id="main"><Outlet /></main><footer className="site-footer"><span className="brand">gather.</span><p>Good things happen when you show up.</p><span>Event discovery powered by Ticketmaster</span></footer></>;
}
