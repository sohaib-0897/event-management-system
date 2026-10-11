# Event Management System

A browser-based event management application using the Ticketmaster Discovery API.

## Development

Requires Node.js 22.12+ and npm. Install with `npm ci`, then run `npm run dev`.
Create a local `.env` beside `package.json` with `VITE_TICKETMASTER_API_KEY=` and enter your Ticketmaster Discovery API key after the equals sign. Never commit this file. `.env.example` contains the empty template.

The application is a Vite + React JavaScript SPA with Redux Toolkit, React Router, Tailwind CSS, and Vitest. It has no backend. The API key is visible to the browser, as expected for a client-only integration; never include it in logs, tests, or PRs.

Run `npm test` for mocked tests and `npm run build` for the production bundle. Serve production builds with an SPA fallback to `index.html`.

## Event discovery

Discovery API search and classifications run directly in the browser. Keyword searches debounce for 350 ms. Requests use AbortController, a 10-second timeout, and start at least 510 ms apart (at most two per second in this app instance). This cannot enforce a shared quota across separate browsers or tabs. Rate-limit errors provide retry guidance without exposing request URLs.

Search results are normalized with image, venue, price, and date fallbacks. Redux caches up to 30 searches for five minutes; API caches are not persisted. Filters live in URL parameters. Daily API quotas still apply.

## Local accounts

## Event details

Sort options are recommended, earliest/latest date, and name. Pagination uses 20 results per page and caps at page index 49. Filter and sort changes reset pagination; URL query state supports refresh and browser history.

Details use a separate freshness cache from search summaries and show event status, date/time, venue, prices, descriptions, and notices. The purchase action opens the returned Ticketmaster URL externally. There is no Partner API integration or checkout.

## Simulated authentication

Registration, login, and logout are simulated in this browser using versioned Local Storage. Passwords are stored as salted PBKDF2 verifiers. This is an assignment demo, not server-enforced security. Use demo credentials. Clearing browser storage removes accounts and saved events.

The `/my-events` route requires a local session; guests return to their intended route after login.

## Git workflow

## Registration and My Events

Registration is a local per-user calendar entry, not a ticket reservation. Duplicate event IDs are rejected for each user. Cancel removes only the active user's entry. Snapshots persist so My Events works without API access.

Upcoming includes unknown-date events with a pending label. Completed uses a known end timestamp; otherwise it moves an event after the end of its calendar day in its venue timezone (UTC fallback). Tabs re-evaluate once per minute while open. Event cancellation and postponement are separate from local registration.

## Feature branches

Each feature is developed on its own branch with several meaningful commits. PRs are merged using merge commits. Feature documentation and validation results accompany each PR.
