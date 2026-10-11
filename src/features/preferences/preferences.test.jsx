import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, it, expect } from 'vitest';
import preferences from './preferencesSlice';
import { ThemeToggle } from './ThemeToggle';
import { initialAuth } from '../auth/authSlice';
import { hydrate, persist } from '../../app/persistence';

afterEach(() => { document.documentElement.classList.remove('dark'); document.documentElement.style.colorScheme = ''; });
describe('theme preferences', () => {
  it('toggles the document theme, persists it, and restores it on reload', async () => {
    const store = configureStore({ reducer: { preferences, auth: () => initialAuth } });
    store.subscribe(() => persist(store.getState()));
    render(<Provider store={store}><ThemeToggle /></Provider>);
    await userEvent.click(screen.getByRole('button', { name: 'Switch to dark mode' }));
    expect(document.documentElement).toHaveClass('dark');
    expect(hydrate().preferences.theme).toBe('dark');
    await userEvent.click(screen.getByRole('button', { name: 'Switch to light mode' }));
    expect(document.documentElement).not.toHaveClass('dark');
    expect(hydrate().preferences.theme).toBe('light');
  });
});
