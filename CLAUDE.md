# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start the React Router dev server (SSR)
- `npm run build` — typegen + typecheck (`tsc -b`) + production build
- `npm run typecheck` — `react-router typegen && tsc -b` without building
- `npm test` — vitest (`src/**/*.test.ts`; config in `vitest.config.ts`, kept separate from `vite.config.ts` so tests don't load the React Router plugin)
- `npm run lint` — ESLint over `**/*.{ts,tsx}`
- `npm run gen-types` — regenerate Supabase types into `src/types/database-types.ts`

## Architecture

### Stack
React 19 + TypeScript + **React Router v7 framework mode** (full SSR), Vite, Tailwind CSS v4 (via `@tailwindcss/vite`), TanStack Query v5, Supabase (auth + Postgres + Storage) with cookie-based sessions via `@supabase/ssr`, deployed on Vercel (framework preset "React Router" via `vercelPreset()` in `react-router.config.ts`).

### Top-level wiring
- `react-router.config.ts` — `appDirectory: "src"`, `ssr: true`, Vercel preset.
- `src/root.tsx` — the HTML document (`Layout` export), default site meta/links, the provider stack (QueryClient per render → AuthProvider → Navbar/Footer chrome), an `ErrorBoundary`, and the root loader (validates the session with `supabase.auth.getUser()` and seeds `AuthProvider` with `initialUser`).
- `src/routes.ts` — route table, built from the `ROUTES` constants in `src/utils/constants.ts` (still the single source of truth; add new routes there). Route modules in `src/routes/` are thin wrappers that re-export feature page components and add `loader`/`meta`.
- `src/entry.client.tsx` — hydration with `<StrictMode>`. No custom server entry; the framework default streams.
- Route-module typegen lives in `.react-router/` (gitignored); run `npm run typecheck` after changing routes to refresh `./+types/*` imports.

### SSR pattern
`/`, `/recipes`, and `/recipe/:id` are the SEO routes: their route modules have loaders and `meta` exports (recipe detail builds per-recipe title/og tags from loader data). Loader data threads into the existing TanStack Query hooks as `initialData` so hydration is instant and client cache behavior is unchanged. **Seeding is gated by user identity**: the recipes loader returns `{ recipes, userId }` and `useRecipes` only uses the seed when it matches the current `useAuth()` user — never seed loader data into a query key derived from client auth state without that check. All other routes SSR only their shell and fetch client-side as before.

Loader/SSR rules:
- Loaders return `data(payload, { headers })` with the headers from `getServerClient` so refreshed auth cookies reach the browser.
- Map only "row not found" errors (PostgREST `PGRST116`, invalid uuid `22P02`) to 404; everything else must be a 500 or outages get pages de-indexed.
- No `localStorage`/`window` access during render — module scope and `useState` initializers run on the server. Use effects (see the draft-restore effect in `features/recipes/components/CreateRecipe.tsx`).

### Supabase clients (three — pick the right one)
- `src/lib/supabase.ts` — cookie-backed browser singleton (`createBrowserClient`); import as `@/lib/supabase` in hooks/components.
- `src/lib/supabase.server.ts` — `getServerClient(request)` for loaders/actions; per-request, runs as the signed-in user so **RLS is the authorization layer**.
- `src/server/supabase-admin.server.ts` — service-role client (bypasses RLS). Only for the cron route and cross-user work (e.g. regenerating other users' lists after a recipe delete). Never import outside `.server.ts` modules; its key comes from non-`VITE_` env vars.

### Backend (TypeScript server modules, not Postgres functions)
Business logic lives under `src/server/` and runs inside the React Router server on Vercel:
- `grocery-aggregation.ts` — pure, I/O-free port of the old SQL aggregation engine (scaling, cross-unit aggregation in base units, best-display-unit selection, note merging, "to taste" handling). Unit-tested in `grocery-aggregation.test.ts`; keep it pure and keep parity caveats (SQL half-away-from-zero rounding) documented.
- `grocery-lists.server.ts` — orchestration: fetch inputs with the caller's client, run the engine, persist via the `replace_generated_grocery_list_items` RPC. That RPC is the one deliberate piece of SQL plumbing: an atomic delete+insert under a per-list advisory lock (PostgREST has no transactions). Regeneration is invoked explicitly after every mutation of `grocery_list_recipes` — if you add a new write path to that table, you must call `regenerateGroceryListItems` after it.
- `recipes.server.ts` — recipe visibility selects and `deleteRecipe` (row delete + Storage photo cleanup + regenerating affected lists via the admin client).

HTTP surface: resource routes in `src/routes/api.*.ts` (`/api/grocery-lists/:listId/recipes`, `/api/grocery-lists/:listId/items`, `/api/recipes/:recipeId`, `/api/cron/cleanup-anonymous-users`). They authenticate via `getUser()`, verify list ownership for clean 404s, and validate bodies. The cron route is guarded by `CRON_SECRET` (Vercel cron sends it as a bearer token; schedule in `vercel.json`).

What intentionally remains in Postgres: RLS policies on every table, `handle_new_anonymous_user` (auth.users trigger), `delete_old_anonymous_users` (called by the cron), and the `replace_generated_grocery_list_items` wrapper. Schema changes go through `supabase/migrations/` as new timestamped files, applied with `supabase db push`.

> Transition note: legacy SQL functions/triggers coexist until `supabase/migrations/20260611130000_drop_ported_postgres_logic.sql` (Migration B) is applied post-deploy. After applying it, run `npm run gen-types` and delete this note.

### Feature-sliced layout
Code is organized by feature under `src/features/<feature>/` (`auth`, `home`, `recipes`, `grocery-lists`), each with its own `components/`, `hooks/`, `pages/`, `types.ts`. The `auth` feature owns `AuthContext.tsx`: Google One Tap, email, anonymous/guest sign-in, password reset, the `initialUser` SSR seed, loader revalidation on sign-in/out, and a one-time localStorage→cookie session migration shim. Shared code lives in `src/components/`, `src/hooks/`, `src/lib/`, `src/utils/` (`constants.ts` has routes, validation, error copy, colors). `@/*` aliases `src/*` — prefer it for cross-folder imports.

### Data layer pattern
Each feature owns its query hooks under `features/<feature>/hooks/`; query keys are centralized per feature (see `features/grocery-lists/hooks/query-keys.ts`). Mutations use `useMutation` with `onSuccess` invalidation; `useToggleGroceryListItem` in `useGroceryListItems.ts` is the canonical optimistic-update pattern. Mutations with business logic (add/remove recipe on a list, manual items) `fetch()` the resource routes; plain RLS-guarded table writes (toggle/remove item, list CRUD) still call Supabase directly from the client. Shared fetchers used by both loaders and hooks live in `features/recipes/api.ts`.

### Storage
Recipe photos upload client-side to the `recipe-photos` bucket (see `useCreateRecipe` in `features/recipes/hooks/useRecipeMutations.ts`); deletion is server-side in `recipes.server.ts`.

### Env vars
Client (Vite-inlined): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_GOOGLE_CLIENT_ID`. Server-only (never `VITE_`-prefixed): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`. `.env` is gitignored.
