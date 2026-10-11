import { afterEach, describe, it, expect, vi } from 'vitest';
import { createTicketmasterClient } from './client';

afterEach(() => vi.useRealTimers());
describe('Discovery client', () => {
  it('spaces request starts so no more than two occur per second', async () => {
    vi.useFakeTimers();
    const starts = [];
    const client = createTicketmasterClient({
      getKey: () => 'mock-key',
      fetcher: vi.fn(async () => {
        starts.push(Date.now());
        return { ok: true, json: async () => ({}) };
      }),
    });
    const jobs = [client('events.json'), client('events.json'), client('classifications.json')];
    await vi.runAllTimersAsync();
    await Promise.all(jobs);
    expect(starts).toHaveLength(3);
    expect(starts[1] - starts[0]).toBeGreaterThanOrEqual(510);
    expect(starts[2] - starts[1]).toBeGreaterThanOrEqual(510);
  });
  it('sanitizes transport errors and handles invalid keys and quotas', async () => {
    const transport = createTicketmasterClient({
      getKey: () => 'mock-key',
      fetcher: async () => {
        throw new TypeError('Sensitive URL must never surface');
      },
    });
    await expect(transport('events.json')).rejects.toThrow('Unable to connect');
    for (const [status, text] of [
      [401, 'authorize'],
      [429, 'request limit'],
    ]) {
      const client = createTicketmasterClient({
        getKey: () => 'mock-key',
        fetcher: async () => ({ ok: false, status }),
      });
      await expect(client('events.json')).rejects.toThrow(text);
    }
  });
  it('aborts queued requests without making a fetch', async () => {
    const fetcher = vi.fn();
    const controller = new AbortController();
    controller.abort();
    const client = createTicketmasterClient({ getKey: () => 'mock-key', fetcher });
    await expect(client('events.json', {}, { signal: controller.signal })).rejects.toMatchObject({
      name: 'AbortError',
    });
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('times out a stalled request with a safe error', async () => {
    vi.useFakeTimers();
    const client = createTicketmasterClient({
      getKey: () => 'mock-key',
      timeoutMs: 100,
      fetcher: (_, { signal }) =>
        new Promise((_, reject) =>
          signal.addEventListener('abort', () =>
            reject(new DOMException('Cancelled', 'AbortError')),
          ),
        ),
    });
    const assertion = expect(client('events.json')).rejects.toThrow('timed out');
    await vi.runAllTimersAsync();
    await assertion;
  });
  it('rejects missing configuration without fetching', async () => {
    const fetcher = vi.fn();
    await expect(
      createTicketmasterClient({ getKey: () => '', fetcher })('events.json'),
    ).rejects.toThrow('local environment');
    expect(fetcher).not.toHaveBeenCalled();
  });
});
