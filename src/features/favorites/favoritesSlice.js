import { createSlice } from '@reduxjs/toolkit';

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState: { byUserId: {} },
  reducers: {
    toggled(state, { payload: { userId, event, savedAt } }) {
      state.byUserId[userId] ||= {};
      if (state.byUserId[userId][event.id]) delete state.byUserId[userId][event.id];
      else state.byUserId[userId][event.id] = { savedAt, eventSnapshot: event };
    },
  },
});
export const toggleFavorite = (event) => (dispatch, getState) => {
  const userId = getState().auth.currentUserId;
  if (userId && event?.id)
    dispatch(favoritesSlice.actions.toggled({ userId, event, savedAt: new Date().toISOString() }));
};
export default favoritesSlice.reducer;
