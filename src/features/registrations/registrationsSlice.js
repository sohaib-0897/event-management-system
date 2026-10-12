import { createSlice } from '@reduxjs/toolkit';
import { isCompleted } from '../../utils/dates';

const registrationsSlice = createSlice({
  name: 'registrations',
  initialState: { byUserId: {} },
  reducers: {
    added(state, { payload: { userId, event, registeredAt } }) {
      state.byUserId[userId] ||= {};
      if (!state.byUserId[userId][event.id])
        state.byUserId[userId][event.id] = { registeredAt, eventSnapshot: event };
    },
    removed(state, { payload: { userId, eventId } }) {
      if (state.byUserId[userId]) delete state.byUserId[userId][eventId];
    },
  },
});
const { added, removed } = registrationsSlice.actions;
export const registerForEvent = (event) => (dispatch, getState) => {
  const state = getState();
  const userId = state.auth.currentUserId;
  if (!userId) return { ok: false, error: 'Log in to register for an event.' };
  if (!event?.id) return { ok: false, error: 'This event is unavailable.' };
  if (state.registrations.byUserId[userId]?.[event.id])
    return { ok: false, error: 'You’re already registered for this event.' };
  if (event.status === 'cancelled' || isCompleted(event))
    return { ok: false, error: 'Registration is unavailable for this event.' };
  dispatch(added({ userId, event, registeredAt: new Date().toISOString() }));
  return { ok: true };
};
export const cancelRegistration = (eventId) => (dispatch, getState) => {
  const state = getState();
  const userId = state.auth.currentUserId;
  const entry = state.registrations.byUserId[userId]?.[eventId];
  if (!userId || !entry) return { ok: false, error: 'No active registration was found.' };
  const event = state.events?.entitiesById[eventId] || entry.eventSnapshot;
  if (isCompleted(event))
    return { ok: false, error: 'Completed registrations cannot be cancelled.' };
  dispatch(removed({ userId, eventId }));
  return { ok: true };
};
export default registrationsSlice.reducer;
