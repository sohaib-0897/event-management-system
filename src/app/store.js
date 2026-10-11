import { configureStore } from '@reduxjs/toolkit';
import auth from '../features/auth/authSlice';
import events from '../features/events/eventsSlice';
import registrations from '../features/registrations/registrationsSlice';
import favorites from '../features/favorites/favoritesSlice';
import preferences from '../features/preferences/preferencesSlice';
import { hydrate, persist } from './persistence';

export function createAppStore(preloadedState) {
  const saved = preloadedState === undefined ? hydrate() : preloadedState;
  const store = configureStore({
    reducer: { auth, events, registrations, favorites, preferences },
    preloadedState: saved
      ? {
          auth: saved.auth,
          registrations: saved.registrations,
          favorites: saved.favorites,
          preferences: saved.preferences,
        }
      : undefined,
  });
  store.subscribe(() => persist(store.getState()));
  return store;
}
export const store = createAppStore();
