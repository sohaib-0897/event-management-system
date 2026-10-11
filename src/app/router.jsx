import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { AuthPage } from '../features/auth/AuthPage';
import { ProtectedRoute } from '../components/ProtectedRoute';

export const router = createBrowserRouter([{ element: <Layout />, children: [
  { path: '/', element: <Navigate to="/events" replace /> },
  { path: '/login', element: <AuthPage /> },
  { path: '/register', element: <AuthPage registering /> },
  { element: <ProtectedRoute />, children: [{ path: '/my-events', element: <div className="page"><h1>My events</h1></div> }] },
  { path: '/events', element: <div className="page"><p className="eyebrow">THE WORLD IS WAITING</p><h1>Find your next<br /><em>great experience.</em></h1><p className="lead">Live music, game days, and nights to remember.</p></div> },
  { path: '*', element: <div className="page"><h1>Page not found</h1><a className="button" href="/events">Explore events</a></div> },
] }]);
