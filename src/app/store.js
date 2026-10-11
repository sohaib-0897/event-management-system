import { configureStore, createSlice } from '@reduxjs/toolkit';

const app = createSlice({ name: 'app', initialState: {}, reducers: {} });
export const store = configureStore({ reducer: { app: app.reducer } });
