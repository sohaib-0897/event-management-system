import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

beforeEach(() => {
  localStorage.clear();
  vi.stubEnv('VITE_TICKETMASTER_API_KEY', 'mock-test-key');
  vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('Unmocked requests are disabled in tests.'))));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
