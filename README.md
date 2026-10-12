# Gather — Event Management System

Gather is a frontend event-management assignment: discover upcoming Ticketmaster events, explore details, create a simulated account, and manage your personal registrations and favorites. It uses React in JavaScript with Redux Toolkit and browser-local persistence. Registration saves a calendar entry; ticket purchases happen through an external Ticketmaster link.

## Live demo

[Open Gather on Vercel](https://event-management-system-eight-pi.vercel.app)

## Assignment features

| Assignment section | Implemented behavior                                                                                                                                            |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authentication     | Register with name/email/password and confirmation; login/logout; email/password validation; duplicate-email prevention; session restoration after refresh      |
| Event discovery    | Upcoming event list; debounced keyword/city search; country/date/category filters; pagination and sorting                                                       |
| Event details      | Name, local date/time and timezone, venue, location/address, category/genre, image, price range, event status, description and additional notices when supplied |
| Registration       | Login required; one registration per user/event; feedback; cancellation for incomplete events; preserved snapshots                                              |
| My Events          | Protected page with Upcoming and Completed tabs; cancellation only for incomplete events; unknown dates remain pending                                          |
| Redux              | Five slices, generated actions/reducers, async thunks, `configureStore`, `useSelector`, and `useDispatch`                                                       |
| Routing            | Login, register, events, details, protected collections, root redirect and 404                                                                                  |
| UX                 | Loading/error/empty states, validated labeled forms, keyboard focus, reusable components, responsive light/dark layouts                                         |
| Extras             | Favorites, dark mode, pagination/sort, mocked unit and browser verification                                                                                     |

## Tech stack

- Vite + React **JavaScript / JSX**
- Redux Toolkit + React Redux
- React Router
- Tailwind CSS and custom CSS
- Lucide React icons
- Vitest, React Testing Library, jsdom, and Playwright for verification
- Prettier and the existing Vite React Babel toolchain for repository lint checks

There is no backend, database server, checkout flow, Next.js, or TypeScript.

## Get a Ticketmaster key and run locally

Requires Node.js **22.12+** and npm.

1. Register/sign in at [developer.ticketmaster.com](https://developer.ticketmaster.com/).
2. Open your developer application and find its **Consumer Key**. This is the Discovery API key, as explained in [Ticketmaster's getting-started guide](https://developer.ticketmaster.com/products-and-docs/tutorials/events-search/search_events_with_discovery_api.html).
3. Clone the repository and install dependencies:

   ```sh
   git clone https://github.com/sohaib-0897/event-management-system.git
   cd event-management-system
   npm install
   ```

4. Copy the empty environment template:

   ```sh
   cp .env.example .env
   ```

   In PowerShell, use `Copy-Item .env.example .env` instead.

5. In your local `.env`, set `VITE_TICKETMASTER_API_KEY` to your Consumer Key. The file belongs in the repository root beside `package.json`. Never commit it, paste the value into tests, or include it in output.
6. Start Vite:

   ```sh
   npm run dev
   ```

7. Open the Local URL printed by Vite, normally `http://127.0.0.1:5173/`. Restart Vite after changing the environment configuration.

`.env.example` contains an empty `VITE_TICKETMASTER_API_KEY=` entry. `.gitignore` excludes `.env`, `node_modules/`, `dist/`, coverage, and local QA artifacts. The lockfile is committed; CI uses `npm ci`.

## Scripts

| Command                | Purpose                                                                                                                 |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`          | Local Vite development server                                                                                           |
| `npm run build`        | Production bundle in `dist/`                                                                                            |
| `npm run preview`      | Preview the production bundle                                                                                           |
| `npm run lint`         | Formatting, JS/JSX syntax, unused bindings, undefined names, console/debugger, unfinished comments and image-alt checks |
| `npm test`             | Run mocked Vitest tests                                                                                                 |
| `npm run test:watch`   | Watch unit tests                                                                                                        |
| `npm run test:browser` | Mocked browser flows plus layout, theme, focus, labels and console review                                               |
| `npm run smoke:live`   | Separate live Discovery API check through Vite, printing only safe status flags                                         |

The lint script uses dependencies already present in the repository; it is a project-specific static check, not ESLint. React effect dependencies are reviewed in source and browser verification.

## Project structure

```text
.github/workflows/ci.yml       CI lint, tests, build and mocked browser checks
public/event-placeholder.svg  Missing-image fallback
scripts/                      Lint, browser QA and safe live smoke helpers
src/
  app/                        Store, router and Local Storage persistence
  components/                 Layout, protected-route gate and shared UI states
  features/
    auth/                     Forms, credential hashing and auth slice
    events/                   Discovery, details, cards and event cache slice
    registrations/            Registration actions and My Events
    favorites/                Favorite controls and protected collection
    preferences/              Persisted theme
  services/ticketmaster/       Throttled client, query validation, normalization
  styles/                     Tailwind import and responsive/theme styles
  test/                       Mock-only setup and fixtures
  utils/                      Form validation, date/completion and price helpers
  main.jsx                    Provider and router entry point
vercel.json                   Single SPA rewrite
vite.config.js                Vite and Vitest configuration
```

Behavioral tests are colocated with the modules they verify.

## Redux store design

`src/app/store.js` uses `configureStore`. Components read state with `useSelector` and dispatch slice actions or thunks with `useDispatch`. Each feature uses `createSlice`; auth and API requests use `createAsyncThunk`.

| Slice           | State                                                                                                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `auth`          | `usersById`, normalized-email lookup `userIdByEmail`, `currentUserId`, request `status`, `error`, and `requestId`                                                               |
| `events`        | Normalized `entitiesById`; `queriesByKey` with result IDs, pagination, status/error/freshness; separate `detailsById` freshness; `classifications` items/status/error/fetchedAt |
| `registrations` | `byUserId[userId][eventId]` containing `registeredAt` and `eventSnapshot`                                                                                                       |
| `favorites`     | `byUserId[userId][eventId]` containing `savedAt` and `eventSnapshot`                                                                                                            |
| `preferences`   | `theme`: light or dark                                                                                                                                                          |

Controllers and timers stay outside Redux so state remains serializable. API caches remain in memory; durable user data and preferences are persisted.

## Routes and access

| Route              | Access         | Purpose                                              |
| ------------------ | -------------- | ---------------------------------------------------- |
| `/`                | Public         | Redirect to `/events`                                |
| `/register`        | Public, guests | Create a simulated account                           |
| `/login`           | Public, guests | Sign in; restore an intended internal destination    |
| `/events`          | Public         | Search and browse                                    |
| `/events/:eventId` | Public         | Details; registration/favorite actions require login |
| `/my-events`       | Protected      | Upcoming and Completed registrations                 |
| `/favorites`       | Protected      | Per-user saved events                                |
| `*`                | Public         | 404 page                                             |

Authenticated visitors to login/register return to their destination or discovery. Protected routes redirect guests to login. Logout clears the active session while preserving each account's saved data.

## Local Storage and simulated auth

The only application Local Storage key is **`gather:v1`**. Its versioned JSON stores accounts, the active user ID, registrations, favorites and theme. The email lookup is rebuilt during hydration. Invalid sessions are discarded; corrupt or unavailable storage falls back without crashing.

**Authentication is a frontend simulation with no real security.** Passwords are represented by salted PBKDF2-SHA-256 verifiers using 100,000 iterations, a random 128-bit salt, and a 256-bit derived value. Plaintext passwords are not persisted, but users can inspect or alter browser storage and bypass frontend route gates. Use demo credentials, not an existing personal password. Accounts are local to this browser and origin; clearing storage removes them.

Registrations and favorites are scoped by user ID and survive refreshes. A registration is not a ticket reservation. Completed registrations stay in history and cannot be cancelled. When an end timestamp is unavailable, completion is approximated at the end of the event's local calendar day in its venue timezone (UTC fallback). Unknown-date events remain Upcoming with a pending label. My Events re-evaluates completion once per minute.

## API limits and request handling

The [Discovery API v2 documentation](https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/) lists a default quota of 5,000 calls per day and a 5 requests/second limit. **This assignment applies the stricter 2 requests/second limit**: request starts are spaced at least 510 ms apart within one app instance.

- Keyword and city inputs debounce for 350 ms.
- Requests use AbortController and a 10-second timeout. Superseded requests are aborted and stale responses are ignored.
- Identical pending queries are deduplicated. Successful search/detail results have a five-minute freshness window; old entries are pruned to 30 searches and 40 details.
- Discovery requests exclude known start times before the current instant, while allowing TBA/TBD events. Date filters can narrow the upcoming range; wholly past ranges show validation guidance.
- Pages contain 20 events and stop at index 49, respecting `size × page < 1000`. Filters and sorting live in the URL; changing them resets pagination.
- Categories come from API classifications. Responses normalize image, price, venue and date gaps with explicit fallbacks.
- Missing-key, authorization, quota, timeout and network failures show safe guidance or retry controls. Request URLs and raw transport errors are not logged.

Separate tabs/browsers are not coordinated, so their combined traffic can still reach the provider's shared quota. There are no automatic retry loops.

## Deploy to Vercel

1. Import this GitHub repository into Vercel and select the Vite preset.
2. Use `npm run build` as the build command and `dist` as the output directory.
3. Add **`VITE_TICKETMASTER_API_KEY`** in Vercel's environment-variable settings for the deployment environments you use.
4. Deploy/redeploy after setting or changing the variable; Vite injects it at build time.
5. Keep the root `vercel.json` rewrite from `/(.*)` to `/index.html`, which allows direct navigation and refreshes on React Router routes.
6. Verify the merge deployment succeeded in Vercel, then test `/events` and `/my-events` directly.

**The API key is visible in the browser bundle and network requests because there is no backend.** Gitignoring the local environment file prevents repository exposure; it does not make a frontend key secret.

## Verification and known limitations

Run `npm run lint`, `npm test`, and `npm run build` before submission. Then run `npm run test:browser` for mocked browser verification. On Windows it uses installed Microsoft Edge; elsewhere install Chromium with `npx playwright install chromium`. QA screenshots are local ignored artifacts under `.qa/`; none are linked here.

Unit and browser tests use mocked responses and dummy keys. The separate `smoke:live` command lets Vite load the local key and returns only safe search/classification/detail status flags. It never opens the environment file directly or prints raw failures. GitHub Actions needs no Ticketmaster credential.

Known limitations:

- Browser-local accounts and saved data do not sync between devices, browsers or origins.
- Registration does not guarantee admission, inventory or ticket purchase.
- API coverage, images, dates, prices and extra information depend on Ticketmaster. Unknown dates remain pending; unavailable descriptions link users to the provider.
- Saved event snapshots can become stale. In-memory fetched data takes precedence; reopening details refreshes stale API data.
- Completion without an end timestamp is an end-of-day approximation.
- Local throttling cannot enforce a quota shared across tabs or other consumers. API deep paging limits discovery to the first 1,000 results per query.
- The lightweight repository lint check is not a full ESLint rule set. Browser review checks runtime warnings and representative accessibility/layout behavior; it is not a certification of accessibility.

For manual verification, register a demo account, refresh, log out/in, filter events, open details, register once, try a duplicate, cancel an upcoming registration, and check My Events, favorites and both themes. A guest should be redirected from protected pages.

## Git workflow

The repository uses one branch per feature or maintenance pass, with meaningful commits and a descriptive PR. PRs are merged with **merge commits**, preserving their branch history. Merged branches are retained. The final reviewed submission is locked with the annotated `v1.0.0` tag (`Final submission`).
