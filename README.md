# Event Management System

A browser-based event management application using the Ticketmaster Discovery API.

## Development

Requires Node.js 22.12+ and npm. Install with `npm ci`, then run `npm run dev`.
Create a local `.env` beside `package.json` with `VITE_TICKETMASTER_API_KEY=` and enter your Ticketmaster Discovery API key after the equals sign. Never commit this file. `.env.example` contains the empty template.

The application is a Vite + React JavaScript SPA with Redux Toolkit, React Router, Tailwind CSS, and Vitest. It has no backend. The API key is visible to the browser, as expected for a client-only integration; never include it in logs, tests, or PRs.

Run `npm test` for mocked tests and `npm run build` for the production bundle. Serve production builds with an SPA fallback to `index.html`.

## Workflow

Each feature is developed on its own branch with several meaningful commits. PRs are merged using merge commits. Feature documentation and validation results accompany each PR.
