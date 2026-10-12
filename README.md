# Gather — Event Management System

A browser-based event management assignment built with Vite, React in JavaScript, Redux Toolkit, React Router, Tailwind CSS, and Vitest. There is no backend.

## Live demo

URL: _Coming soon — add the deployed URL here._

## Run locally

Requires Node.js 22.12+ and npm.

```sh
npm ci
npm run dev
```

Create `.env` in the repository root beside `package.json`. It needs `VITE_TICKETMASTER_API_KEY=` followed by your Ticketmaster Discovery API key. `.env.example` is the empty committed template. `.env` is gitignored. Restart Vite after configuring it.

The key is available to the browser in this client-only application. Do not include it in logs, screenshots of developer tools, tests, commits, or PR descriptions. Build output in `dist/` is ignored.

## Features and routes

| Route                    | Behavior                                                                               |
| ------------------------ | -------------------------------------------------------------------------------------- |
| `/events`                | Public search, categories, city/country/date filters, sorting, pagination              |
| `/events/:eventId`       | Public event details, local registration/cancellation, favorites, external ticket link |
| `/register` and `/login` | Simulated local accounts and session restoration                                       |
| `/my-events`             | Protected Upcoming and Completed registration tabs                                     |
| `/favorites`             | Protected per-user saved events                                                        |

Guests return to their intended internal route after signing in. Logout clears the active session while retaining saved account data. Unknown routes show a not-found page.

Accounts, active session, registrations, favorites, and light/dark preference use versioned Local Storage. Passwords are stored as salted PBKDF2 verifiers. Authentication is a browser-local assignment simulation, not server-enforced security; use demo credentials. Clearing browser storage removes saved data. Corrupt/unavailable storage is handled without crashing.

Registration adds a personal calendar entry; it does not reserve a ticket. Duplicate event IDs are rejected per user. Cancellation affects only the active user's entry. Snapshots allow saved collections to render without API access.

Upcoming includes unknown-date events marked as pending. Completed uses a known end timestamp, or the end of the event's local calendar day in its venue timezone (UTC fallback). Tabs re-evaluate every minute while open. Event cancellation/postponement is displayed separately from local registration. Cached event data takes precedence over a saved snapshot when available; reopening details refreshes stale data.

Purchases take place through the external Ticketmaster event URL. There is no checkout or Partner API integration.

## Discovery API behavior

- Keyword and city inputs debounce for 350 ms. Filters and paging are stored in URL query parameters.
- Requests use AbortController, a 10-second timeout, sanitized errors, and at least 510 ms between request starts: at most two requests per second in this app instance. This browser-local throttle cannot coordinate independent tabs or browsers; provider daily quotas still apply.
- Redux caches searches and details for five minutes, with up to 30 searches and 40 detail entries. Identical pending requests are deduplicated; superseded responses are ignored. API caches are not persisted.
- Results normalize images, prices/currency, venues, descriptions, status, and dates. Missing values use explicit fallbacks; TBA/TBD events do not receive invented timestamps.
- Sorting supports recommended, earliest/latest date, and name. Pages contain 20 events and stop at index 49, respecting `size × page < 1000`. Filter/sort changes reset the page.
- Loading, empty, configuration, authorization, quota, timeout, and connectivity states offer clear guidance or retry actions.

Reference: [Ticketmaster Discovery API v2](https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/).

## Validation

```sh
npm test              # Vitest: mocked network responses and dummy credentials only
npm run test:browser  # Mocked desktop/mobile browser flows; uses a dummy API key
npm run build         # Production bundle
npm run preview       # Serve the production bundle
npm run smoke:live    # Separate real-API check through Vite; prints only safe status results
```

The browser scripts use installed Microsoft Edge on Windows. On other platforms, install Chromium with `npx playwright install chromium`. Browser QA saves ignored screenshots under `.qa/`. The live smoke script never opens the environment file, extracts its value, or logs raw exceptions/request URLs; only Vite provides the key to the app's API client.

GitHub Actions runs mocked unit tests, the production build, and mocked browser checks. It needs no Ticketmaster key. For static hosting, configure an SPA fallback to `index.html`.

## Structure

`src/app` contains routing, store setup, and persistence. `src/features` owns auth, events, registrations, favorites, and preferences. `src/services/ticketmaster` owns requests, query validation, and normalization. Shared UI lives under `src/components`, utilities under `src/utils`, and fixtures under `src/test`. Tests sit beside the behavior they verify.

## Git workflow

Every feature has its own branch and several meaningful commits, then a PR merged with a merge commit. Branches were implemented in order: app foundation, simulated auth, event discovery, event details, pagination/sort, registration/My Events, favorites, and dark mode. A final browser-verification branch adds integrated QA and fixes found during review.
