import { mkdir } from 'node:fs/promises';
import { expect } from '@playwright/test';
import { startBrowserSession } from './browser-runtime.mjs';
import { rawEvent } from '../src/test/fixtures/events.js';

let session;
let diagnosticPage;
let stage = 'startup';
try {
  session = await startBrowserSession('test');
  await mkdir('.qa', { recursive: true });
  const context = await session.browser.newContext({ viewport: { width: 1440, height: 1000 } });
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
  page.on('pageerror', () => {
    pageErrors += 1;
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
  expect(pageErrors).toBe(0);
  console.log(
    'PASS: mocked desktop/mobile discovery, filters, pagination, auth, registration, favorites, persistence, theme, and error recovery.',
  );
} catch (error) {
  await diagnosticPage?.screenshot({ path: '.qa/browser-failure.png', fullPage: true }).catch(() => {});
  console.error(`Diagnostic: ${error.name || 'Error'} (details suppressed).`);
  console.error(`FAIL: browser verification at ${stage}.`);
  process.exitCode = 1;
} finally {
  await session?.close();
}
