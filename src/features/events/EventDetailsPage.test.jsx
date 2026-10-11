import { describe, it, expect, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import events, { fetchEvents, fetchEventDetails } from './eventsSlice';
import { EventDetailsPage } from './EventDetailsPage';
import { ticketmasterRequest } from '../../services/ticketmaster/client';
import { rawEvent, searchResponse } from '../../test/fixtures/events';
import auth from '../auth/authSlice';
import registrations from '../registrations/registrationsSlice';
import favorites from '../favorites/favoritesSlice';

vi.mock('../../services/ticketmaster/client', () => ({ ticketmasterRequest: vi.fn() }));
describe('event details', () => {
  it('fetches complete details even when search summaries are cached', async () => {
    ticketmasterRequest
      .mockResolvedValueOnce(searchResponse)
      .mockResolvedValueOnce({ ...rawEvent, info: 'Full event description' });
    const store = configureStore({ reducer: { events, auth, registrations, favorites } });
    await store.dispatch(fetchEvents({ filters: {} }));
    await store.dispatch(fetchEventDetails({ id: rawEvent.id }));
    expect(store.getState().events.entitiesById[rawEvent.id].description).toBe(
      'Full event description',
    );
    await store.dispatch(fetchEventDetails({ id: rawEvent.id }));
    expect(ticketmasterRequest).toHaveBeenCalledTimes(2);
  });
  it('renders an external purchase link and honest missing data', async () => {
    ticketmasterRequest.mockResolvedValue({
      id: 'demo-event',
      name: 'Mystery show',
      url: 'https://www.ticketmaster.com/demo-event',
    });
    const store = configureStore({ reducer: { events, auth, registrations, favorites } });
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/events/demo-event']}>
          <Routes>
            <Route path="/events/:eventId" element={<EventDetailsPage />} />
          </Routes>
        </MemoryRouter>
      </Provider>,
    );
    expect(await screen.findByRole('heading', { name: 'Mystery show' })).toBeInTheDocument();
    const link = screen.getByRole('link', { name: 'Tickets on Ticketmaster' });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.getByText('Date to be announced')).toBeInTheDocument();
    expect(screen.getByText('Venue to be announced')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Price unavailable' })).toBeInTheDocument();
  });
});
