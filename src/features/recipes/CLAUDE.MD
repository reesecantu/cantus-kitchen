# recipes feature

## Overview

Recipes are the core domain object. A recipe has a name, servings count, ordered steps, an optional photo, and a list of `recipe_ingredients` (ingredient + unit + amount + note + `group_label` + `position`). Recipes are either public (`is_public = true`) or private to their creator — RLS enforces this.

## File map

| Path | Role |
|------|------|
| `api.ts` | Shared fetchers used by both loaders and client hooks: `fetchRecipes`, `fetchRecipeDetails`, `fetchUnitsForDisplay` |
| `types.ts` | `RecipeFormData`, `RecipeIngredient` — the shape state flows through the form layer |
| `hooks/useRecipes.ts` | List query, keyed on `["recipes", userId]`; accepts `SsrRecipes` seed from the loader |
| `hooks/useRecipeDetails.ts` | Single-recipe query, keyed on `["recipe-details", recipeId]`; accepts `initialData` seed |
| `hooks/useIngredients.ts` | Ingredient catalog, keyed on `["ingredients"]`; loaded in `RecipeForm` (background fetch, not a loading gate) |
| `hooks/useRecipeMutations.ts` | `useCreateRecipe`, `useUpdateRecipe`, `useDeleteRecipe` |
| `components/RecipeForm.tsx` | Controlled presentational form shared by create and edit |
| `components/CreateRecipe.tsx` | Create container — owns localStorage draft restore/save |
| `components/EditRecipe.tsx` | Edit container — seeds from loader data |
| `pages/` | Thin page wrappers that connect route loader data to feature components |

## Key invariants

**Photo upload is client-side.** `uploadRecipeImage` in `useRecipeMutations.ts` uploads directly to the `recipe-photos` Storage bucket before the row write. The resulting public URL is passed in the `POST /api/recipes` or `PUT /api/recipes/:id` body. Deletion is server-side in `src/server/recipes.server.ts` (needs the service-role client to clean up Storage).

**Mutations go through resource routes, not Supabase directly.** `useCreateRecipe` → `POST /api/recipes`, `useUpdateRecipe` → `PUT /api/recipes/:id`, `useDeleteRecipe` → `DELETE /api/recipes/:id`. The server routes run under RLS and regenerate affected grocery lists after edits/deletes.

**SSR seeding is user-gated.** `useRecipes` only uses the loader's `initialData` when `ssr.userId === currentUserId`. Never pass loader data as `initialData` without this check — a sign-in/out would show stale data for the wrong auth state.

**`RecipeForm` is presentational — state is lifted.** `CreateRecipe` holds form state in `useState` and persists a localStorage draft (restored in a `useEffect` to avoid SSR/hydration mismatch). `EditRecipe` seeds state from the loaded recipe. Both pass controlled `formData`/`onChange`/`onSubmit` props down.

**Validation bounds mirror DB constraints.** `RecipeForm.tsx` enforces `name < 100 chars` and `0 < servings < 300` — these match the `recipes_name_check` and `recipes_servings_check` Postgres constraints. Keep them in sync if the constraints change.

**Ingredients are a flat, ordered array — groups are derived, not nested.** Each `RecipeIngredient` row carries an optional `group_label` (null/"" = ungrouped); `IngredientMultiSelect` and `RecipeDetails` render sections by splitting the array into *contiguous runs of equal `group_label`*. Array order is the source of truth and is persisted as `position` (assigned from the array index in `useRecipeMutations`). The same ingredient may appear in multiple groups, but the per-group add dropdown blocks duplicates *within* one group. `rowId` (`RecipeIngredient.rowId`) is a client-only stable identity for form rows (the DB row `id` on edit, a `crypto.randomUUID()` on create) — it is never sent to the server. Empty groups awaiting their first ingredient live in component state only. Grocery aggregation ignores groups: it keys by `ingredient_id` and combines a repeated ingredient into one line.

## Adding a new recipe field

1. Add a migration in `supabase/migrations/` for the column.
2. Run `npm run gen-types` to refresh `src/types/database-types.ts`.
3. Add the field to `RecipeFormData` in `types.ts`.
4. Update `RecipeForm.tsx` to render the input.
5. Pass the field in the `POST`/`PUT` body inside `useRecipeMutations.ts`.
6. Handle it in the server route (`src/routes/api.recipes.ts` or `api.recipes.$recipeId.ts`).
7. Include it in the `fetchRecipeDetails` select in `api.ts` if it needs to be displayed.
