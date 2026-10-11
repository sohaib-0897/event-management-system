import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import registrations, { cancelRegistration, registerForEvent } from './registrationsSlice';
import { MyEventsPage } from './MyEventsPage';
import { normalizeEvent } from '../../services/ticketmaster/normalize';
import { rawEvent } from '../../test/fixtures/events';
import { isCompleted } from '../../utils/dates';
import { hydrate, persist } from '../../app/persistence';
import { initialAuth } from '../auth/authSlice';
import favorites from '../favorites/favoritesSlice';

function makeStore(userId = 'a', saved) {
  const user = {
    id: userId,
    name: 'Demo User',
    email: `${userId}@example.com`,
    salt: 'a'.repeat(32),
    verifier: 'b'.repeat(64),
  };
  return configureStore({
    reducer: {
      auth: () => ({ ...initialAuth, currentUserId: userId, usersById: { [userId]: user } }),
      registrations,
      favorites,
      events: () => ({ entitiesById: {} }),
    },
    preloadedState: saved ? { registrations: saved } : undefined,
  });
}
describe('event registration', () => {
  it('prevents duplicates, isolates users, and cancels only the active user’s entry', () => {
    const event = normalizeEvent(rawEvent);
    const a = makeStore();
    expect(a.dispatch(registerForEvent(event))).toEqual({ ok: true });
    expect(a.dispatch(registerForEvent(event)).error).toContain('already registered');
    const b = makeStore('b', a.getState().registrations);
    expect(b.dispatch(registerForEvent(event))).toEqual({ ok: true });
    b.dispatch(cancelRegistration(event.id));
    expect(b.getState().registrations.byUserId.a[event.id]).toBeTruthy();
    expect(b.getState().registrations.byUserId.b[event.id]).toBeUndefined();
    persist(a.getState());
    expect(hydrate().registrations.byUserId.a[event.id].eventSnapshot.name).toBe(event.name);
  });
  it('rejects guests, cancelled events, and completed events', () => {
    const event = normalizeEvent(rawEvent);
    expect(makeStore(null).dispatch(registerForEvent(event)).ok).toBe(false);
    expect(makeStore().dispatch(registerForEvent({ ...event, status: 'cancelled' })).ok).toBe(
      false,
    );
    expect(
      makeStore().dispatch(registerForEvent({ ...event, endAt: '2000-01-01T00:00:00Z' })).ok,
    ).toBe(false);
  });
  it('handles timezone day boundaries and unknown dates honestly', () => {
    const now = Date.parse('2030-06-15T23:30:00Z');
    expect(isCompleted({ localDate: '2030-06-15', timezone: 'America/New_York' }, now)).toBe(false);
    expect(isCompleted({ localDate: '2030-06-15', timezone: 'Asia/Karachi' }, now)).toBe(true);
    expect(isCompleted({ datePending: true }, now)).toBe(false);
    expect(isCompleted({ localDate: '2030-06-15', endAt: '2030-06-15T21:00:00Z' }, now)).toBe(true);
  });
  it('renders Upcoming and Completed from saved snapshots without API calls', async () => {
    const event = normalizeEvent(rawEvent);
    const store = makeStore('a', {
      byUserId: {
        a: {
          future: {
            eventSnapshot: {
              ...event,
              id: 'future',
              name: 'Future experience',
              localDate: '2099-01-01',
              startAt: null,
            },
          },
          past: {
            eventSnapshot: {
              ...event,
              id: 'past',
              name: 'Past experience',
              localDate: '2000-01-01',
              startAt: null,
            },
          },
        },
      },
    });
    render(
      <Provider store={store}>
        <MemoryRouter>
          <MyEventsPage />
        </MemoryRouter>
      </Provider>,
    );
    expect(screen.getByRole('heading', { name: 'Future experience' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Completed/ }));
    expect(screen.getByRole('heading', { name: 'Past experience' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel registration' }));
    expect(screen.queryByRole('heading', { name: 'Past experience' })).not.toBeInTheDocument();
  });
});
