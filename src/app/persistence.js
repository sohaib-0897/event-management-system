import { initialAuth } from '../features/auth/authSlice';

const STORAGE_KEY = 'gather:v1';
let storageFailed = false;
const record = (value) => value && typeof value === 'object' && !Array.isArray(value);
export function hydrate() {
  storageFailed = false;
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!saved || saved.version !== 1) return undefined;
    const usersById = {};
    const userIdByEmail = {};
    for (const user of Object.values(saved.auth?.usersById || {})) {
      if (
        !user ||
        typeof user.id !== 'string' ||
        typeof user.email !== 'string' ||
        typeof user.name !== 'string' ||
        !/^[a-f0-9]{32}$/.test(user.salt) ||
        !/^[a-f0-9]{64}$/.test(user.verifier)
      )
        continue;
      usersById[user.id] = user;
      userIdByEmail[user.email] = user.id;
    }
    const auth = {
      ...initialAuth,
      usersById,
      userIdByEmail,
      currentUserId: usersById[saved.auth?.currentUserId] ? saved.auth.currentUserId : null,
    };
    const result = { auth };
    for (const slice of ['registrations', 'favorites']) {
      const byUserId = {};
      if (record(saved[slice]?.byUserId)) {
        for (const [userId, entries] of Object.entries(saved[slice].byUserId)) {
          if (!usersById[userId] || !record(entries)) continue;
          byUserId[userId] = Object.fromEntries(
            Object.entries(entries).filter(
              ([id, entry]) =>
                record(entry) &&
                record(entry.eventSnapshot) &&
                entry.eventSnapshot.id === id &&
                typeof entry.eventSnapshot.name === 'string',
            ),
          );
        }
      }
      result[slice] = { byUserId };
    }
    result.preferences = { theme: saved.preferences?.theme === 'dark' ? 'dark' : 'light' };
    return result;
  } catch {
    storageFailed = true;
    return undefined;
  }
}
export function persist(state) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        auth: { usersById: state.auth.usersById, currentUserId: state.auth.currentUserId },
        registrations: state.registrations,
        favorites: state.favorites,
        preferences: state.preferences,
      }),
    );
    storageFailed = false;
  } catch {
    storageFailed = true;
  }
}
export const hasStorageError = () => storageFailed;
