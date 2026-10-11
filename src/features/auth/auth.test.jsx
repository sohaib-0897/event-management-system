import { describe, it, expect } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { webcrypto } from 'node:crypto';
import { vi } from 'vitest';
import auth, { register, login, logout } from './authSlice';
import { hydrate, persist } from '../../app/persistence';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { validateAuth } from '../../utils/validation';

const account = {
  name: 'Alex Gather',
  email: ' Alex@example.com ',
  password: 'demo-pass-123',
  confirmPassword: 'demo-pass-123',
};
describe('local authentication', () => {
  it('registers, prevents duplicate emails, persists, logs out and logs in', async () => {
    vi.stubGlobal('crypto', webcrypto);
    const store = configureStore({ reducer: { auth } });
    await store.dispatch(register(account));
    const id = store.getState().auth.currentUserId;
    expect(id).toBeTruthy();
    expect(store.getState().auth.usersById[id].email).toBe('alex@example.com');
    expect(store.getState().auth.usersById[id]).not.toHaveProperty('password');
    await store.dispatch(register(account));
    expect(store.getState().auth.error).toContain('already exists');
    persist(store.getState());
    expect(hydrate().auth.currentUserId).toBe(id);
    store.dispatch(logout());
    expect(store.getState().auth.currentUserId).toBeNull();
    await store.dispatch(login({ ...account, password: 'wrong-password' }));
    expect(store.getState().auth.currentUserId).toBeNull();
    await store.dispatch(login(account));
    expect(store.getState().auth.currentUserId).toBe(id);
  });
  it('validates required fields and confirmation', () => {
    expect(validateAuth({ ...account, email: 'invalid' }, true)).toContain('email');
    expect(validateAuth({ ...account, confirmPassword: 'different' }, true)).toContain('match');
  });
  it('redirects guests away from protected content', () => {
    const store = configureStore({ reducer: { auth } });
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/my-events']}>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path="/my-events" element={<p>Private events</p>} />
            </Route>
            <Route path="/login" element={<p>Login destination</p>} />
          </Routes>
        </MemoryRouter>
      </Provider>,
    );
    expect(screen.getByText('Login destination')).toBeInTheDocument();
    expect(screen.queryByText('Private events')).not.toBeInTheDocument();
  });
  it('recovers from corrupt storage and invalid sessions', () => {
    localStorage.setItem('gather:v1', '{broken');
    expect(hydrate()).toBeUndefined();
    localStorage.setItem(
      'gather:v1',
      JSON.stringify({ version: 1, auth: { usersById: {}, currentUserId: 'missing' } }),
    );
    expect(hydrate().auth.currentUserId).toBeNull();
  });
});
