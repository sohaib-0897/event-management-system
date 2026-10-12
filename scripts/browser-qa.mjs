import { mkdir } from 'node:fs/promises';
import { expect as baseExpect } from '@playwright/test';
import { startBrowserSession } from './browser-runtime.mjs';
import { rawEvent } from '../src/test/fixtures/events.js';

const expect = baseExpect.configure({ timeout: 15000 });

let session;
let diagnosticPage;
let stage = 'startup';
try {
  session = await startBrowserSession('test');
  await mkdir('.qa', { recursive: true });
  const context = await session.browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: 'reduce',
  });
  let failureMode = '';
  const searches = [];
  const future = {
    ...rawEvent,
    dates: {
      ...rawEvent.dates,
      start: { dateTime: '2099-06-15T19:00:00Z', localDate: '2099-06-15', localTime: '20:00:00' },
    },
  };
  const second = {
    ...future,
    id: 'second-event',
    name: 'A Night at the Orchestra',
    classifications: [{ primary: true, segment: { id: 'arts', name: 'Arts & Theatre' } }],
  };
  await context.route('https://app.ticketmaster.com/discovery/v2/**', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('/classifications.json'))
      return route.fulfill({
        json: {
          _embedded: {
            classifications: [
              { segment: { id: 'music', name: 'Music' } },
              { segment: { id: 'arts', name: 'Arts & Theatre' } },
            ],
          },
        },
      });
    if (url.pathname.endsWith('/events.json')) {
      searches.push(Object.fromEntries([...url.searchParams].filter(([key]) => key !== 'apikey')));
      if (failureMode === 'error') return route.fulfill({ status: 429, json: {} });
      const page = Number(url.searchParams.get('page') || 0);
      return route.fulfill({
        json: {
          _embedded: { events: failureMode === 'empty' ? [] : page ? [second] : [future, second] },
          page: {
            number: page,
            size: 20,
            totalElements: failureMode === 'empty' ? 0 : 40,
            totalPages: failureMode === 'empty' ? 0 : 2,
          },
        },
      });
    }
    return route.fulfill({ json: url.pathname.includes('second-event') ? second : future });
  });
  const page = await context.newPage();
  diagnosticPage = page;
  page.setDefaultTimeout(15000);
  let pageErrors = 0;
  let consoleWarnings = 0;
  page.on('pageerror', () => {
    pageErrors += 1;
  });
  page.on('console', (message) => {
    if (
      ['warning', 'error'].includes(message.type()) &&
      !message.text().startsWith('Failed to load resource:')
    )
      consoleWarnings += 1;
  });
  stage = 'discovery';
  await page.goto(`${session.baseUrl}/events`);
  await expect(page.getByRole('heading', { name: future.name })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Music', exact: true })).toBeVisible();
  await page.screenshot({ path: '.qa/discovery-desktop.png', fullPage: true });
  stage = 'debounced multiword city';
  await page.getByRole('textbox', { name: 'City', exact: true }).fill('New York');
  await expect.poll(() => searches.at(-1)?.city).toBe('New York');
  await page.getByRole('textbox', { name: 'Search events' }).fill('live music');
  await expect.poll(() => searches.at(-1)?.keyword).toBe('live music');
  await page.getByRole('combobox', { name: 'Sort events' }).selectOption('date,asc');
  await expect.poll(() => searches.at(-1)?.sort).toBe('date,asc');
  await page.getByRole('button', { name: 'Next page' }).click();
  await expect(page.getByText('Page 2 of 2')).toBeVisible();
  await page.getByRole('button', { name: 'Music', exact: true }).click();
  await expect.poll(() => searches.at(-1)?.page).toBe('0');
  stage = 'protected route and registration';
  await page.goto(`${session.baseUrl}/my-events`);
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  await page.getByRole('link', { name: 'Create an account', exact: true }).click();
  await page.getByLabel('Your name').fill('Alex Gather');
  await page.getByLabel('Email address').fill('alex@example.com');
  await page.getByLabel('Password', { exact: true }).fill('demo-password-123');
  await page.getByLabel('Confirm password').fill('demo-password-123');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(/\/my-events/);
  await page.goto(`${session.baseUrl}/events/demo-event`);
  await expect(page.getByRole('heading', { name: future.name })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Tickets on Ticketmaster' })).toHaveAttribute(
    'target',
    '_blank',
  );
  await page.getByRole('button', { name: 'Register for event' }).click();
  await expect(page.getByText('You’re registered')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Register for event' })).toHaveCount(0);
  stage = 'favorites and persistence';
  await page.getByRole('button', { name: `Save ${future.name} to favorites` }).click();
  await page.reload();
  await expect(page.getByText('You’re registered')).toBeVisible();
  await expect(
    page.getByRole('button', { name: `Remove ${future.name} from favorites` }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('link', { name: 'Favorites', exact: true }).click();
  await expect(page.getByRole('heading', { name: future.name })).toBeVisible();
  await page.getByRole('button', { name: `Remove ${future.name} from favorites` }).click();
  await expect(page.getByRole('heading', { name: 'Something will catch your eye' })).toBeVisible();
  stage = 'My Events tabs and cancellation';
  await page.getByRole('link', { name: 'My events', exact: true }).click();
  await expect(page.getByRole('heading', { name: future.name })).toBeVisible();
  await page.getByRole('button', { name: /Completed/ }).click();
  await expect(page.getByRole('heading', { name: 'Your memories start here' })).toBeVisible();
  await page.getByRole('button', { name: /Upcoming/ }).click();
  await page.getByRole('button', { name: 'Cancel registration' }).click();
  await expect(
    page.getByRole('heading', { name: 'Your calendar has room for something great' }),
  ).toBeVisible();
  stage = 'logout and credential validation';
  await page.getByRole('button', { name: 'Log out' }).click();
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  await page.getByLabel('Email address').fill('alex@example.com');
  await page.getByLabel('Password', { exact: true }).fill('incorrect-password');
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText(/Email or password is incorrect/);
  await page.getByLabel('Password', { exact: true }).fill('demo-password-123');
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await expect(page).toHaveURL(/\/my-events/);
  stage = 'theme and responsive layouts';
  await page.getByRole('button', { name: 'Switch to dark mode' }).click();
  await page.reload();
  await expect(page.locator('html')).toHaveClass('dark');
  await page.goto(`${session.baseUrl}/events`);
  await expect(page.getByRole('heading', { name: future.name })).toBeVisible();
  await page.screenshot({ path: '.qa/discovery-dark.png', fullPage: true });
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    if (width === 375) await page.screenshot({ path: '.qa/discovery-mobile.png', fullPage: true });
  }
  stage = 'empty and error recovery';
  failureMode = 'empty';
  await page.goto(`${session.baseUrl}/events?keyword=empty-fixture`);
  await expect(page.getByRole('heading', { name: 'No events found' })).toBeVisible();
  failureMode = 'error';
  await page.goto(`${session.baseUrl}/events?keyword=quota-fixture`);
  await expect(page.getByRole('alert')).toContainText('request limit');
  failureMode = '';
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByRole('heading', { name: future.name })).toBeVisible();
  stage = 'main-page layout, contrast and keyboard audit';
  await page.goto(`${session.baseUrl}/events/demo-event`);
  await page.getByRole('button', { name: 'Register for event' }).click();
  await page.getByRole('button', { name: `Save ${future.name} to favorites` }).click();
  await page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem('gather:v1'));
    const entries = saved.registrations.byUserId[saved.auth.currentUserId];
    entries['past-fixture'] = {
      registeredAt: '2000-01-01T00:00:00Z',
      eventSnapshot: {
        ...entries['demo-event'].eventSnapshot,
        id: 'past-fixture',
        name: 'Completed fixture experience',
        startAt: '2000-01-01T19:00:00Z',
        localDate: '2000-01-01',
        endAt: '2000-01-01T21:00:00Z',
      },
    };
    localStorage.setItem('gather:v1', JSON.stringify(saved));
  });
  async function auditPage(path, theme, width) {
    stage = `review ${path} ${theme} ${width}`;
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`${session.baseUrl}${path}`);
    if (path === '/events')
      await expect(page.getByRole('heading', { name: future.name })).toBeVisible();
    else if (path === '/events/demo-event')
      await expect(page.getByRole('heading', { name: future.name })).toBeVisible();
    else await expect(page.locator('main h1:visible, main h2:visible').first()).toBeVisible();
    const toggle = page.getByRole('button', { name: `Switch to ${theme} mode` });
    if (await toggle.count()) await toggle.click();
    await expect(page.locator('html')).toHaveClass(theme === 'dark' ? 'dark' : '');
    const result = await page.evaluate(() => {
      const rgb = (value) => {
        const parts = value.match(/[\d.]+/g)?.map(Number) || [];
        return [parts[0] || 0, parts[1] || 0, parts[2] || 0, parts[3] ?? 1];
      };
      const background = (element) => {
        const ancestry = [];
        for (let node = element; node; node = node.parentElement) ancestry.unshift(node);
        return ancestry.reduce(
          (base, node) => {
            const color = rgb(getComputedStyle(node).backgroundColor);
            return color
              .slice(0, 3)
              .map((channel, i) => channel * color[3] + base[i] * (1 - color[3]));
          },
          [255, 255, 255],
        );
      };
      const lum = (color) =>
        color
          .map((channel) => {
            const value = channel / 255;
            return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
          })
          .reduce((sum, value, i) => sum + value * [0.2126, 0.7152, 0.0722][i], 0);
      const failures = [];
      let samples = 0;
      const check = (element, pseudo) => {
        const style = getComputedStyle(element, pseudo);
        const color = rgb(style.color);
        const bg = background(element);
        const fg = color.slice(0, 3).map((value, i) => value * color[3] + bg[i] * (1 - color[3]));
        const ratio = (Math.max(lum(fg), lum(bg)) + 0.05) / (Math.min(lum(fg), lum(bg)) + 0.05);
        const size = parseFloat(style.fontSize);
        const large = size >= 24 || (size >= 18.66 && Number(style.fontWeight) >= 700);
        const minimum = large ? 3 : 4.5;
        samples += 1;
        if (ratio < minimum)
          failures.push({
            element: element.tagName + '.' + element.className,
            ratio: Number(ratio.toFixed(2)),
            minimum,
          });
      };
      const visible = (element) =>
        element.getClientRects().length && !element.closest('[aria-hidden="true"], :disabled');
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const node = walker.currentNode;
        const element = node.parentElement;
        if (
          node.textContent.trim() &&
          element &&
          visible(element) &&
          !['SCRIPT', 'STYLE', 'OPTION', 'TITLE'].includes(element.tagName)
        )
          check(element);
      }
      for (const input of document.querySelectorAll('input, select'))
        if (visible(input)) {
          check(input);
          if (input.hasAttribute('placeholder')) check(input, '::placeholder');
        }
      return {
        overflow: document.documentElement.scrollWidth > innerWidth,
        failures,
        samples,
        missingLabels: [...document.querySelectorAll('input, select')].filter(
          (input) =>
            visible(input) &&
            !input.labels?.length &&
            !input.getAttribute('aria-label') &&
            !input.getAttribute('aria-labelledby'),
        ).length,
        missingAlt: [...document.images].filter((image) => !image.hasAttribute('alt')).length,
      };
    });
    expect(result.overflow).toBe(false);
    expect(result.missingLabels).toBe(0);
    expect(result.missingAlt).toBe(0);
    if (result.failures.length)
      process.stderr.write(`Contrast findings: ${JSON.stringify(result.failures)}\n`);
    expect(result.failures).toHaveLength(0);
    expect(result.samples).toBeGreaterThan(5);
    if (path.includes('tab=completed'))
      await expect(page.getByRole('button', { name: 'Cancel registration' })).toHaveCount(0);
    await page.evaluate(() => {
      document.activeElement?.blur();
      document.body.setAttribute('tabindex', '-1');
      document.body.focus();
      document.body.removeAttribute('tabindex');
    });
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#main')).toBeFocused();
    await page.screenshot({
      path: `.qa/polish-${theme}-${width}-${path.replace(/[^a-z0-9]/gi, '-')}.png`,
      fullPage: true,
    });
  }
  for (const theme of ['light', 'dark'])
    for (const width of [375, 768, 1440])
      for (const path of [
        '/events',
        '/events/demo-event',
        '/my-events',
        '/my-events?tab=completed',
        '/favorites',
        '/not-a-page',
      ])
        await auditPage(path, theme, width);
  await page.getByRole('button', { name: 'Log out' }).click();
  for (const theme of ['light', 'dark'])
    for (const width of [375, 768, 1440])
      for (const path of ['/login', '/register']) await auditPage(path, theme, width);
  expect(pageErrors).toBe(0);
  expect(consoleWarnings).toBe(0);
  process.stdout.write(
    'PASS: mocked discovery, auth, registrations, favorites and recovery; 48 page/theme/width reviews with contrast, focus, labels, alt text and zero runtime warnings.' +
      '\n',
  );
} catch (error) {
  await diagnosticPage
    ?.screenshot({ path: '.qa/browser-failure.png', fullPage: true })
    .catch(() => {});
  process.stderr.write(`Diagnostic: ${error.name || 'Error'} (details suppressed).` + '\n');
  process.stderr.write(`FAIL: browser verification at ${stage}.` + '\n');
  process.exitCode = 1;
} finally {
  await session?.close();
}
