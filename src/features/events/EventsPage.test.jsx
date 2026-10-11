import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import events from './eventsSlice';
import { EventsPage } from './EventsPage';
import { ticketmasterRequest } from '../../services/ticketmaster/client';
import { searchResponse } from '../../test/fixtures/events';

vi.mock('../../services/ticketmaster/client', () => ({ ticketmasterRequest: vi.fn() }));
function Location() { const location = useLocation(); return <output data-testid="location">{location.search}</output>; }
describe('search URL state', () => {
  it('resets pagination when sorting changes and preserves filters', async () => {
    ticketmasterRequest.mockImplementation(async (path) => path === 'classifications.json' ? {} : searchResponse);
    const store = configureStore({ reducer: { events } });
    render(<Provider store={store}><MemoryRouter initialEntries={['/events?keyword=live&page=2']}><EventsPage /><Location /></MemoryRouter></Provider>);
    await screen.findByRole('heading', { name: 'The Midnight — Live' });
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Sort events' }), 'date,asc');
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('sort=date%2Casc'));
    expect(screen.getByTestId('location')).not.toHaveTextContent('page=');
    expect(screen.getByTestId('location')).toHaveTextContent('keyword=live');
  });
});
