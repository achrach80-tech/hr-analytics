## Purpose

This file gives AI coding agents the minimal, high-value context to be productive in this repository.
Keep edits brief and focused — prefer small, safe changes (components, helpers, docs) and call out any uncertain assumptions.

## Big-picture architecture

- Next.js (App Router) app in `app/` — routes use the new file-based layout and route groups (e.g. `app/(auth)/`, `app/(dashboard)/`, `app/admin`).
- UI is React + Tailwind CSS; global layout is in `app/layout.tsx` and `app/globals.css`.
- Data and auth: Supabase is used for client and server access: `lib/supabase/client.ts` (browser) and `lib/supabase/server.ts` (server-side cookies).
- Server routes use Next App Router route handlers (see `app/api/.../route.ts`).
- Components are organized under `components/` (dashboard widgets in `components/dashboard/`).

## Key developer workflows

- Start dev server: `npm run dev` (uses `next dev --turbopack`, default port 3000).
- Build for prod: `npm run build` then `npm run start`.
- Lint: `npm run lint` (ESLint configured via `eslint-config-next`).

If you need to change bundler behavior, note `--turbopack` is set in scripts.

## Essential conventions and patterns (do not invent alternatives)

- App Router groups: parentheses in `app/(...)` create route groups and shared layouts — follow existing folder structure for new routes.
- Auth is cookie-based and enforced by `middleware.ts`. Dashboard pages expect a `company_session` cookie; admin pages expect `admin_session`.
- Supabase usage:
  - Client-side: `lib/supabase/client.ts` uses `createBrowserClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)`.
  - Server-side: `lib/supabase/server.ts` uses `createServerClient` with Next `cookies()` to forward session cookies.
  - Required env vars: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (set in env/local dev). If you need elevated permissions, look for service-role usage elsewhere before adding secrets.
- Formatting helpers are centralized in `lib/utils.ts` (e.g., `cn()`, `formatCurrency()`, `formatDate()`); reuse them instead of ad-hoc formatting.
- Styling: use Tailwind classes and the `cn(...)` helper to merge classNames (imports from `lib/utils.ts`). Prefer `className={cn('base', conditional && 'modifier')}`.
- State & data fetching: project uses `@tanstack/react-query` in places — follow its patterns for caching and stale times if adding async hooks.

## Data flows & integration points to watch

- Import pipeline: front-end CSV/XLSX upload -> API route `app/api/import/process/route.ts` -> `lib/import/optimized/optimizedProcessor.ts` (see `lib/import/` for types/hooks).
- KPI/dashboard components live in `components/dashboard/` and consume processed data from `lib/hooks/` (e.g., `useOptimizedKPIData.ts`). When adding metrics, prefer creating small presentation components and keep computation in hooks/processor code.
- Email sending uses `resend` dependency — search for `resend` usage when working on notifications.
- Password hashing: `hashPassword.js` and `bcryptjs` are present — re-use these utilities for authentication flows.

## Small examples (follow these patterns)

- Adding a route: place a folder in `app/(dashboard)/new-feature/` with `page.tsx` and (optional) `layout.tsx` to inherit the dashboard layout.
- Using a Supabase server client in a server component:
  - import `createClient` from `lib/supabase/server.ts` and await it inside the server component to run queries with the current cookies.
- Formatting money in UI: `import { formatCurrency } from 'lib/utils'` and use `formatCurrency(amount)` in render.

## Safety / quick-checks before committing changes

- Run `npm run dev` and verify the changed page loads on `http://localhost:3000`.
- Check middleware redirects (e.g., missing cookies) when changing auth routes.
- Avoid adding new top-level env names — follow existing `NEXT_PUBLIC_` naming.

## Where to look for more context

- `app/` — route structure and layouts.
- `components/dashboard/` — examples of UI components and patterns (KPI cards, charts).
- `lib/` — utils, hooks, import processing, and Supabase clients.
- `middleware.ts` — route protection rules and cookie names.

If anything here is unclear or you need more project-specific examples (tests, CI, or deployment settings), tell me which area and I will expand or adjust this file.
