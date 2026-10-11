import { configureStore } from '@reduxjs/toolkit';
import auth from '../features/auth/authSlice';
import { hydrate, persist } from './persistence';

export function createAppStore(preloadedState) {
  const saved = preloadedState === undefined ? hydrate() : preloadedState;
  const store = configureStore({ reducer: { auth }, preloadedState: saved ? { auth: saved.auth } : undefined });
  store.subscribe(() => persist(store.getState()));
  return store;
}
export const store = createAppStore();
