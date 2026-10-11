import { chromium } from '@playwright/test';
import { createServer } from 'vite';

export async function startBrowserSession(mode) {
  const server = await createServer({
    mode,
    logLevel: 'silent',
    server: { host: '127.0.0.1', port: 0 },
  });
  await server.listen();
  try {
    const browser = await chromium.launch({
      channel: process.platform === 'win32' ? 'msedge' : undefined,
      headless: true,
    });
    const address = server.httpServer.address();
    return {
      server,
      browser,
      baseUrl: `http://127.0.0.1:${address.port}`,
      async close() {
        await browser.close();
        await server.close();
      },
    };
  } catch {
    await server.close();
    throw new Error('Browser session could not start.');
  }
}
