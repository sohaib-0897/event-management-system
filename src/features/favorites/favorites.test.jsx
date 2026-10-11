import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import favorites, { toggleFavorite } from './favoritesSlice';
import { FavoritesPage } from './FavoritesPage';
import { FavoriteButton } from './FavoriteButton';
import { normalizeEvent } from '../../services/ticketmaster/normalize';
import { rawEvent } from '../../test/fixtures/events';
import { hydrate, persist } from '../../app/persistence';
import { initialAuth } from '../auth/authSlice';

function makeStore(userId = 'a', saved) {
  const user = { id: userId, name: 'Demo', email: `${userId}@example.com`, salt: 'a'.repeat(32), verifier: 'b'.repeat(64) };
  return configureStore({ reducer: { favorites, events: () => ({ entitiesById: {} }), auth: () => ({ ...initialAuth, currentUserId: userId, usersById: { [userId]: user } }) }, preloadedState: saved ? { favorites: saved } : undefined });
}
describe('favorites', () => {
  it('persists snapshots and isolates toggles per user', () => {
    const event = normalizeEvent(rawEvent); const a = makeStore(); a.dispatch(toggleFavorite(event));
    persist(a.getState());
    expect(hydrate().favorites.byUserId.a[event.id]).toBeTruthy();
    const b = makeStore('b', a.getState().favorites); b.dispatch(toggleFavorite(event)); b.dispatch(toggleFavorite(event));
    expect(b.getState().favorites.byUserId.a[event.id]).toBeTruthy();
    expect(b.getState().favorites.byUserId.b[event.id]).toBeUndefined();
  });
  it('removes a saved event from the favorites page', async () => {
    const event = normalizeEvent(rawEvent); const store = makeStore(); store.dispatch(toggleFavorite(event));
    render(<Provider store={store}><MemoryRouter><FavoritesPage /></MemoryRouter></Provider>);
    await userEvent.click(screen.getByRole('button', { name: `Remove ${event.name} from favorites` }));
    expect(screen.getByRole('heading', { name: 'Something will catch your eye' })).toBeInTheDocument();
  });
  it('sends guests to login before saving an event', async () => {
    const event = normalizeEvent(rawEvent); const store = makeStore(null);
    render(<Provider store={store}><MemoryRouter><Routes><Route path="/" element={<FavoriteButton event={event} />} /><Route path="/login" element={<p>Please log in</p>} /></Routes></MemoryRouter></Provider>);
    await userEvent.click(screen.getByRole('button', { name: `Save ${event.name} to favorites` }));
    expect(screen.getByText('Please log in')).toBeInTheDocument();
    expect(store.getState().favorites.byUserId).toEqual({});
  });
});
