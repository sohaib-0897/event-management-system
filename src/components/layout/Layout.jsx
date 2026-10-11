import { NavLink, Outlet } from 'react-router-dom';

export function Layout() {
  return <><a className="skip-link" href="#main">Skip to content</a><header className="site-header"><NavLink to="/events" className="brand"><span className="brand-mark">g</span>gather<span className="brand-dot">.</span></NavLink><nav aria-label="Main navigation"><NavLink to="/events">Discover</NavLink></nav><span className="header-note">Go out. Make memories.</span></header><main id="main"><Outlet /></main><footer className="site-footer"><span className="brand">gather.</span><p>Good things happen when you show up.</p><span>Event discovery powered by Ticketmaster</span></footer></>;
}
