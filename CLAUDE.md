# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start Vite dev server
- `npm run build` — typecheck (`tsc -b`) and build for production (prerenders `Home` via `prerender.tsx`)
- `npm run lint` — ESLint over `**/*.{ts,tsx}`
- `npm run preview` — preview the production build
- `npm run gen-types` — regenerate Supabase types into `src/types/database-types.ts`

There is no test runner configured.

## Architecture

### Stack
React 19 + TypeScript + Vite, Tailwind CSS v4 (via `@tailwindcss/vite`), React Router v7, TanStack Query v5, Supabase (auth + Postgres + Storage), deployed on Vercel.

### Top-level wiring
- `src/main.tsx` mounts the provider stack: `QueryClientProvider` → `AuthProvider` → `BrowserRouter` → `App`.
- `src/App.tsx` declares every route. All route paths (including dynamic patterns and builders) are centralized in `src/utils/constants.ts` under `ROUTES` — add new routes there rather than hard-coding strings.
- `prerender.tsx` SSR-renders the `Home` feature for the `/` route at build time via `vite-prerender-plugin`. Vercel rewrites all paths to `/` (see `vercel.json`) so client-side routing handles everything else.
- `vite.config.ts` includes a custom `closePlugin` that calls `process.exit(0)` in `closeBundle` to work around a React 19 build-hang issue — don't remove it.
- `@/*` path alias resolves to `src/*` (configured in `tsconfig.app.json` and `vite.config.ts`). All cross-folder imports use it — prefer `@/components/Foo` over `../../components/Foo`.

### Feature-sliced layout
Code is organized by feature under `src/features/<feature>/`, each containing its own `components/`, `hooks/`, `pages/`, and `types.ts`. Features: `auth`, `home`, `recipes`, `grocery-lists`. The `auth` feature additionally owns `AuthContext.tsx` (exposes `useAuth()` with Google, email, anonymous/guest, and password-reset methods — anonymous sign-in powers "Guest Mode").

Cross-feature code lives directly under `src/`:
- `src/components/` — flat folder with all shared React components (`Navbar`, `Footer`, form inputs, generic UI primitives).
- `src/hooks/` — shared hooks: `useIngredients`, `useUnits`, `useFormValidation`.
- `src/lib/supabase.ts` — the Supabase client singleton; import as `@/lib/supabase`.
- `src/types/` — `database-types.ts` (generated Supabase types) and `globals.d.ts` (window/Google Identity Services augmentation).
- `src/utils/` — `constants.ts` (routes, validation rules, error copy, color tokens) and `routeHelper.ts`.

The only barrel `index.ts` in the codebase is `src/features/home/index.ts`, which exists solely because `prerender.tsx` imports `Home` via the feature directory.

### Data layer pattern
Supabase is the single backend. The client is instantiated once in `src/lib/supabase.ts` and imported everywhere as `@/lib/supabase`. Postgres migrations, the `.temp/` cache, and `schema.sql` live in the repo-root `supabase/` directory (where the Supabase CLI expects them) — application code never reaches in there.

Each feature owns its query hooks under `features/<feature>/hooks/`:
- Query keys are centralized per feature (see `features/grocery-lists/hooks/query-keys.ts`) — follow this pattern when adding queries so cache invalidation stays consistent.
- Mutations use TanStack Query's `useMutation` with `onSuccess` invalidation. Optimistic updates with rollback are used where UX matters (see `useToggleGroceryListItem` in `useGroceryListItems.ts` for the canonical pattern: `onMutate` snapshots + writes optimistic state, `onError` rolls back, `onSettled` invalidates).

### Postgres RPCs
Significant business logic lives in Supabase Postgres functions (see `supabase/migrations/`). Notable RPCs called from the frontend via `supabase.rpc(...)`:
- `add_recipe_to_grocery_list(list_id, p_recipe_id, servings_multiplier)`
- `add_manual_item_to_grocery_list(list_id, ingredient_name, quantity, unit_name, notes)`
- `regenerate_grocery_list_items(list_id)` — triggered automatically when recipes are added/removed
- `find_best_unit_for_quantity(...)` — chooses the most human-readable unit (e.g. "2 cups" over "32 tablespoons") when aggregating ingredients across recipes
- `get_public_and_user_recipes()` / `get_public_recipes()` — recipe lists respecting visibility

When changing grocery-list aggregation or unit display logic, the source of truth is usually the Postgres function, not the TypeScript. Schema/function changes go through `supabase/migrations/` as new timestamped files.

### Storage
Recipe photos are uploaded to the `recipe-photos` Supabase Storage bucket. File paths are slugified from recipe name + timestamp + cleaned filename (see `useCreateRecipe` in `features/recipes/hooks/useRecipeMutations.ts`).

### Env vars
`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are required (read in `src/lib/supabase.ts`). `.env` is gitignored.
