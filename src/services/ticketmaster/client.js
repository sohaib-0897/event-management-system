const ROOT = 'https://app.ticketmaster.com/discovery/v2/';
function delay(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(new DOMException('Cancelled', 'AbortError'));
    const stop = () => {
      clearTimeout(timer);
      reject(new DOMException('Cancelled', 'AbortError'));
    };
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', stop);
      resolve();
    }, ms);
    signal.addEventListener('abort', stop, { once: true });
  });
}
export function createTicketmasterClient({
  getKey = () => import.meta.env.VITE_TICKETMASTER_API_KEY,
  fetcher = (...args) => fetch(...args),
  timeoutMs = 10000,
} = {}) {
  let gate = Promise.resolve();
  let lastStart = -Infinity;
  async function slot(signal) {
    const previous = gate;
    let release;
    gate = new Promise((resolve) => {
      release = resolve;
    });
    try {
      await previous;
      await delay(Math.max(0, 510 - (Date.now() - lastStart)), signal);
      signal.throwIfAborted();
      lastStart = Date.now();
    } finally {
      release();
    }
  }
  return async function (path, params = {}, { signal } = {}) {
    const key = getKey();
    if (!key)
      throw new Error(
        'Add your Ticketmaster API key to the local environment file, then restart the app.',
      );
    const controller = new AbortController();
    let timedOut = false;
    const cancel = () => controller.abort();
    if (signal?.aborted) controller.abort();
    else signal?.addEventListener('abort', cancel, { once: true });
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);
    try {
      await slot(controller.signal);
      const url = new URL(path, ROOT);
      for (const [name, value] of Object.entries(params))
        if (value !== '' && value !== null && value !== undefined)
          url.searchParams.set(name, String(value));
      url.searchParams.set('apikey', key);
      const response = await fetcher(url.toString(), { signal: controller.signal });
      if (response.status === 401 || response.status === 403)
        throw new Error(
          'Ticketmaster could not authorize this request. Check your API key locally.',
        );
      if (response.status === 429)
        throw new Error(
          'Ticketmaster’s request limit was reached. Please wait before trying again.',
        );
      if (response.status === 404) throw new Error('This event is no longer available.');
      if (!response.ok)
        throw new Error('Ticketmaster is temporarily unavailable. Please try again.');
      try {
        return await response.json();
      } catch {
        throw new Error('Ticketmaster returned an unreadable response. Please try again.');
      }
    } catch (error) {
      if (timedOut) throw new Error('The request timed out. Please try again.');
      if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
      // Never expose a raw transport error: it may contain a request URL or key.
      if (error instanceof TypeError)
        throw new Error('Unable to connect to Ticketmaster. Check your connection and try again.');
      if (error.name === 'AbortError') throw new DOMException('Cancelled', 'AbortError');
      if (
        error.message.startsWith('Ticketmaster') ||
        error.message === 'This event is no longer available.'
      )
        throw error;
      throw new Error('Unable to load events. Please try again.');
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener('abort', cancel);
    }
  };
}
export const ticketmasterRequest = createTicketmasterClient();
