import { configureStore } from '@reduxjs/toolkit';
import { describe, it, expect, vi } from 'vitest';
import { ticketmasterRequest } from '../../services/ticketmaster/client';
import events, { fetchEvents } from './eventsSlice';
import { searchResponse } from '../../test/fixtures/events';
import { queryKey } from '../../services/ticketmaster/query';

vi.mock('../../services/ticketmaster/client', () => ({ ticketmasterRequest: vi.fn() }));
describe('search cache', () => {
  it('reuses fresh results and deduplicates concurrent identical searches', async () => {
    ticketmasterRequest.mockResolvedValue(searchResponse);
    const store = configureStore({ reducer: { events } });
    const first = store.dispatch(fetchEvents({ filters: {} }));
    await store.dispatch(fetchEvents({ filters: {} }));
    await first;
    await store.dispatch(fetchEvents({ filters: {} }));
    expect(ticketmasterRequest).toHaveBeenCalledOnce();
    expect(store.getState().events.queriesByKey[queryKey({})].ids).toEqual(['demo-event']);
    await store.dispatch(fetchEvents({ filters: {}, force: true }));
    expect(ticketmasterRequest).toHaveBeenCalledTimes(2);
  });
  it('records recoverable errors and can retry', async () => {
    ticketmasterRequest
      .mockRejectedValueOnce(new Error('Connection unavailable'))
      .mockResolvedValueOnce(searchResponse);
    const store = configureStore({ reducer: { events } });
    await store.dispatch(fetchEvents({ filters: {} }));
    expect(store.getState().events.queriesByKey[queryKey({})].status).toBe('error');
    await store.dispatch(fetchEvents({ filters: {}, force: true }));
    expect(store.getState().events.queriesByKey[queryKey({})].status).toBe('success');
  });
});
