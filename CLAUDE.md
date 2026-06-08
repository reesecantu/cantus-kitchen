# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start Vite dev server
- `npm run build` — typecheck (`tsc -b`) and build for production (prerenders `Home` via `prerender.tsx`)
- `npm run lint` — ESLint over `**/*.{ts,tsx}`
- `npm run preview` — preview the production build
- `npm run gen-types` — regenerate Supabase types. **Note:** the script writes to `src/types/database-types.ts`, but the actual file consumed by the app lives at `src/shared/types/database-types.ts`. After regenerating, move/overwrite the file to the correct path (or update the script) — imports throughout the app reference `shared/types/database-types`.

There is no test runner configured.

## Architecture

### Stack
React 19 + TypeScript + Vite, Tailwind CSS v4 (via `@tailwindcss/vite`), React Router v7, TanStack Query v5, Supabase (auth + Postgres + Storage), deployed on Vercel.

### Top-level wiring
- `src/main.tsx` mounts the provider stack: `QueryClientProvider` → `AuthProvider` → `BrowserRouter` → `App`.
- `src/App.tsx` declares every route. All route paths (including dynamic patterns and builders) are centralized in `src/utils/constants.ts` under `ROUTES` — add new routes there rather than hard-coding strings.
- `prerender.tsx` SSR-renders the `Home` feature for the `/` route at build time via `vite-prerender-plugin`. Vercel rewrites all paths to `/` (see `vercel.json`) so client-side routing handles everything else.
- `vite.config.ts` includes a custom `closePlugin` that calls `process.exit(0)` in `closeBundle` to work around a React 19 build-hang issue — don't remove it.

### Feature-sliced layout
Code is organized by feature under `src/features/<feature>/`, each containing its own `components/`, `hooks/`, `pages/`, `types.ts`, and `index.ts`. Features: `auth`, `home`, `recipes`, `grocery-lists`.

Cross-feature code lives in:
- `src/shared/` — components (`Navbar`, `Footer`, form inputs, generic UI), hooks (`useIngredients`, `useUnits`, `useFormValidation`), and `types/database-types.ts` (generated Supabase types).
- `src/contexts/AuthContext.tsx` — the only React Context in the app; exposes `useAuth()` with all auth methods (Google, email, anonymous/guest, password reset). Anonymous sign-in powers the "Guest Mode" feature.
- `src/utils/` — `constants.ts` (routes, validation rules, error copy, color tokens) and `routeHelper.ts`.
- `src/ui/components/` — duplicate of some `shared/components/` subfolders; **prefer `shared/components/` for new work**.

### Data layer pattern
Supabase is the single backend. The client is instantiated once in `supabase/supabase-client.ts` and imported via relative paths from feature hooks (e.g. `../../../../supabase/supabase-client`).

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
`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are required (read in `supabase/supabase-client.ts`). `.env` is gitignored.
