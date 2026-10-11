import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { normalizeEmail, validateAuth } from '../../utils/validation';
import { newSalt, passwordVerifier } from './credentials';

export const register = createAsyncThunk('auth/register', async (values, { getState, rejectWithValue }) => {
  const error = validateAuth(values, true);
  if (error) return rejectWithValue(error);
  const email = normalizeEmail(values.email);
  if (getState().auth.userIdByEmail[email]) return rejectWithValue('An account with this email already exists.');
  const salt = newSalt();
  const verifier = await passwordVerifier(values.password, salt);
  if (getState().auth.userIdByEmail[email]) return rejectWithValue('An account with this email already exists.');
  return { id: crypto.randomUUID(), name: values.name.trim(), email, salt, verifier };
});
export const login = createAsyncThunk('auth/login', async (values, { getState, rejectWithValue }) => {
  const error = validateAuth(values);
  if (error) return rejectWithValue(error);
  const { usersById, userIdByEmail } = getState().auth;
  const user = usersById[userIdByEmail[normalizeEmail(values.email)]];
  if (!user || await passwordVerifier(values.password, user.salt) !== user.verifier) return rejectWithValue('Email or password is incorrect.');
  return user.id;
});
export const initialAuth = { usersById: {}, userIdByEmail: {}, currentUserId: null, status: 'idle', error: null, requestId: null };
const authSlice = createSlice({ name: 'auth', initialState: initialAuth, reducers: {
  logout(state) { state.currentUserId = null; state.error = null; state.status = 'idle'; state.requestId = null; },
  clearAuthError(state) { state.error = null; },
}, extraReducers(builder) {
  for (const thunk of [register, login]) {
    builder.addCase(thunk.pending, (state, action) => { state.status = 'loading'; state.error = null; state.requestId = action.meta.requestId; });
    builder.addCase(thunk.rejected, (state, action) => {
      if (state.requestId !== action.meta.requestId) return;
      state.status = 'idle'; state.error = action.payload || 'Sign-in is unavailable. Try again.'; state.requestId = null;
    });
  }
  builder.addCase(register.fulfilled, (state, action) => {
    if (state.requestId !== action.meta.requestId) return;
    const user = action.payload;
    state.usersById[user.id] = user; state.userIdByEmail[user.email] = user.id;
    state.currentUserId = user.id; state.status = 'idle'; state.requestId = null;
  });
  builder.addCase(login.fulfilled, (state, action) => {
    if (state.requestId !== action.meta.requestId) return;
    state.currentUserId = action.payload; state.status = 'idle'; state.requestId = null;
  });
} });
export const { logout, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
