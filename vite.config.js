import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => ({
  define:
    mode === 'test'
      ? { 'import.meta.env.VITE_TICKETMASTER_API_KEY': JSON.stringify('mock-browser-key') }
      : {},
  plugins: [react(), tailwindcss()],
  test: {
    pool: 'threads',
    maxWorkers: 2,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    env: { VITE_TICKETMASTER_API_KEY: 'mock-test-key' },
    restoreMocks: true,
  },
}));
