import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { ticketmasterRequest } from '../../services/ticketmaster/client';
import { normalizeSearch } from '../../services/ticketmaster/normalize';
import { apiParams, queryKey } from '../../services/ticketmaster/query';

export const CACHE_TTL = 5 * 60 * 1000;
export const fresh = (entry) => entry?.status === 'success' && Date.now() - entry.fetchedAt < CACHE_TTL;
export const fetchEvents = createAsyncThunk('events/search', async ({ filters }, { signal, rejectWithValue }) => {
  try { return normalizeSearch(await ticketmasterRequest('events.json', apiParams(filters), { signal })); }
  catch (error) { if (signal.aborted) throw error; return rejectWithValue(error.message); }
}, { condition: ({ filters, force }, { getState }) => {
  const entry = getState().events.queriesByKey[queryKey(filters)];
  return entry?.status !== 'loading' && (force || !fresh(entry));
} });
export const fetchCategories = createAsyncThunk('events/categories', async (_, { signal, rejectWithValue }) => {
  try {
    const data = await ticketmasterRequest('classifications.json', {}, { signal });
    const segments = (data._embedded?.classifications || []).map((c) => c.segment).filter((s) => s?.id && s?.name);
    return [...new Map(segments.map((segment) => [segment.id, { id: segment.id, name: segment.name }])).values()];
  } catch (error) { if (signal.aborted) throw error; return rejectWithValue(error.message); }
}, { condition: (_, { getState }) => getState().events.classifications.status !== 'loading' && !fresh(getState().events.classifications) });
const eventsSlice = createSlice({ name: 'events', initialState: { entitiesById: {}, queriesByKey: {}, detailsById: {}, classifications: { items: [], status: 'idle', error: null, fetchedAt: 0 } }, reducers: {}, extraReducers(builder) {
  builder.addCase(fetchEvents.pending, (state, action) => {
    const key = queryKey(action.meta.arg.filters);
    state.queriesByKey[key] = { ...state.queriesByKey[key], status: 'loading', error: null, requestId: action.meta.requestId };
  }).addCase(fetchEvents.fulfilled, (state, action) => {
    const key = queryKey(action.meta.arg.filters); const entry = state.queriesByKey[key];
    if (entry?.requestId !== action.meta.requestId) return;
    for (const event of action.payload.events) if (!fresh(state.detailsById[event.id])) state.entitiesById[event.id] = event;
    state.queriesByKey[key] = { ids: action.payload.events.map((event) => event.id), page: action.payload.page, status: 'success', error: null, fetchedAt: Date.now() };
    const keys = Object.keys(state.queriesByKey).filter((k) => k !== key && state.queriesByKey[k].status !== 'loading').sort((a, b) => (state.queriesByKey[a].fetchedAt || 0) - (state.queriesByKey[b].fetchedAt || 0));
    while (Object.keys(state.queriesByKey).length > 30 && keys.length) delete state.queriesByKey[keys.shift()];
    const used = new Set([...Object.values(state.queriesByKey).flatMap((q) => q.ids || []), ...Object.keys(state.detailsById)]);
    for (const id of Object.keys(state.entitiesById)) if (!used.has(id)) delete state.entitiesById[id];
  }).addCase(fetchEvents.rejected, (state, action) => {
    const entry = state.queriesByKey[queryKey(action.meta.arg.filters)];
    if (entry?.requestId !== action.meta.requestId) return;
    entry.status = action.meta.aborted ? 'idle' : 'error'; entry.error = action.meta.aborted ? null : action.payload || 'Unable to load events.';
  });
  builder.addCase(fetchCategories.pending, (state) => { state.classifications.status = 'loading'; state.classifications.error = null; })
    .addCase(fetchCategories.fulfilled, (state, action) => { state.classifications = { items: action.payload, status: 'success', error: null, fetchedAt: Date.now() }; })
    .addCase(fetchCategories.rejected, (state, action) => { state.classifications.status = action.meta.aborted ? 'idle' : 'error'; state.classifications.error = action.meta.aborted ? null : action.payload || 'Categories are unavailable.'; });
} });
export default eventsSlice.reducer;
