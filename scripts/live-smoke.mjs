import { startBrowserSession } from './browser-runtime.mjs';

let session;
try {
  // Only Vite loads the local environment. This script never opens or extracts it.
  session = await startBrowserSession('development');
  const page = await session.browser.newPage();
  await page.route(`${session.baseUrl}/smoke-host`, (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<!doctype html><title>API smoke check</title>',
    }),
  );
  await page.goto(`${session.baseUrl}/smoke-host`);
  const result = await page.evaluate(async () => {
    try {
      const { ticketmasterRequest } = await import('/src/services/ticketmaster/client.js');
      const search = await ticketmasterRequest('events.json', { size: 1 });
      const categories = await ticketmasterRequest('classifications.json');
      const id = search._embedded?.events?.[0]?.id;
      const details = id
        ? await ticketmasterRequest(`events/${encodeURIComponent(id)}.json`)
        : null;
      return {
        ok: Boolean(search.page && categories._embedded && (!id || details?.id)),
        search: Boolean(search.page),
        classifications: Boolean(categories._embedded),
        details: Boolean(details?.id),
      };
    } catch {
      return { ok: false };
    }
  });
  if (!result.ok) throw new Error('Smoke check failed');
  process.stdout.write(
    `PASS: live Discovery search=${result.search}, classifications=${result.classifications}, details=${result.details}.` +
      '\n',
  );
} catch {
  process.stderr.write(
    'FAIL: live Discovery smoke check. Check local configuration, connectivity, or quota. No credential or request details were logged.' +
      '\n',
  );
  process.exitCode = 1;
} finally {
  await session?.close();
}
