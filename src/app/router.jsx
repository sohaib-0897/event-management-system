import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { AuthPage } from '../features/auth/AuthPage';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { EventsPage } from '../features/events/EventsPage';
import { EventDetailsPage } from '../features/events/EventDetailsPage';
import { MyEventsPage } from '../features/registrations/MyEventsPage';
import { FavoritesPage } from '../features/favorites/FavoritesPage';

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Navigate to="/events" replace /> },
      { path: '/login', element: <AuthPage /> },
      { path: '/register', element: <AuthPage registering /> },
      {
        element: <ProtectedRoute />,
        children: [
          { path: '/my-events', element: <MyEventsPage /> },
          { path: '/favorites', element: <FavoritesPage /> },
        ],
      },
      { path: '/events', element: <EventsPage /> },
      { path: '/events/:eventId', element: <EventDetailsPage /> },
      {
        path: '*',
        element: (
          <div className="page">
            <h1>Page not found</h1>
            <a className="button" href="/events">
              Explore events
            </a>
          </div>
        ),
      },
    ],
  },
]);
