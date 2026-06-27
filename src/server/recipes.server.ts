import type { SupabaseClient } from "@supabase/supabase-js";
import { regenerateGroceryListItems } from "./grocery-lists.server";
import { normalizeGroupLabel } from "@/features/recipes/ingredient-groups";

/** Validated, normalized ingredient row as persisted by the create/replace RPCs. */
export interface PayloadIngredient {
  ingredient_id: number;
  unit_id: string | null;
  unit_amount: number | null;
  note: string | null;
  group_label: string | null;
  position: number;
}

/**
 * Validate + normalize the untrusted `ingredients` array from a create/update
 * request body. Returns null if the array is missing/empty or any row is
 * malformed (callers map that to a 400). Shared by both recipe routes so create
 * and update enforce identical rules.
 */
export function validateIngredients(
  raw: unknown
): PayloadIngredient[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const ingredients: PayloadIngredient[] = [];
  for (const [index, item] of raw.entries()) {
    if (!item || typeof item !== "object") return null;
    const ing = item as Record<string, unknown>;
    if (typeof ing.ingredient_id !== "number") return null;
    if (ing.unit_id != null && typeof ing.unit_id !== "string") return null;
    if (ing.unit_amount != null && typeof ing.unit_amount !== "number") {
      return null;
    }
    if (ing.group_label != null && typeof ing.group_label !== "string") {
      return null;
    }
    if (ing.position != null && typeof ing.position !== "number") return null;
    ingredients.push({
      ingredient_id: ing.ingredient_id,
      unit_id: (ing.unit_id as string | null) ?? null,
      unit_amount: (ing.unit_amount as number | null) ?? null,
      note:
        typeof ing.note === "string" && ing.note.trim() ? ing.note.trim() : null,
      group_label: normalizeGroupLabel(
        typeof ing.group_label === "string" ? ing.group_label : null
      ),
      // Trust the client's order but fall back to array index defensively.
      position: typeof ing.position === "number" ? ing.position : index,
    });
  }
  return ingredients;
}

/**
 * Delete a recipe row (RLS-checked via the user's client) and clean up its
 * photo in Storage — replaces the `trg_enqueue_recipe_photo_delete` trigger
 * and its never-drained storage_delete_jobs queue. A failed photo delete is
 * logged and swallowed: an orphaned object is acceptable, a broken delete
 * flow is not.
 *
 * `admin` (service-role client) is needed because the recipes →
 * grocery_list_recipes ON DELETE CASCADE can remove the recipe from OTHER
 * users' grocery lists, whose items must then be regenerated — lists the
 * deleting user's RLS-scoped client cannot even see.
 */
export async function deleteRecipe(
  supabase: SupabaseClient,
  admin: SupabaseClient,
  recipeId: string
): Promise<void> {
  const { data: recipe, error: fetchError } = await supabase
    .from("recipes")
    .select("id, image_url")
    .eq("id", recipeId)
    .maybeSingle();
  if (fetchError) throw fetchError;
  if (!recipe) throw new Error("Recipe not found");

  // Capture which lists reference this recipe before the cascade erases them
  const { data: affectedLists, error: affectedError } = await admin
    .from("grocery_list_recipes")
    .select("grocery_list_id")
    .eq("recipe_id", recipeId);
  if (affectedError) throw affectedError;

  const { error: deleteError } = await supabase
    .from("recipes")
    .delete()
    .eq("id", recipeId);
  if (deleteError) throw deleteError;

  // Clean up photo before regen: the row is already gone, so this must run
  // regardless of whether regen succeeds.
  if (recipe.image_url) {
    const path = recipe.image_url.replace(/^.*?\/recipe-photos\//, "");
    if (path) {
      const { error: storageError } = await supabase.storage
        .from("recipe-photos")
        .remove([path]);
      if (storageError) {
        console.error("Failed to delete recipe photo:", storageError);
      }
    }
  }

  const listIds = [
    ...new Set((affectedLists ?? []).map((row) => row.grocery_list_id)),
  ];
  // Per-list try/catch: one bad list must not abort regeneration of the rest.
  for (const listId of listIds) {
    try {
      await regenerateGroceryListItems(admin, listId);
    } catch (err) {
      console.error(`Failed to regenerate grocery list ${listId}:`, err);
    }
  }
}

export interface CreateRecipePayload {
  name: string;
  steps: string[];
  servings: number;
  image_url: string | null;
  created_by: string;
  ingredients: PayloadIngredient[];
}

/**
 * Create a recipe and its ingredients atomically via the `create_recipe` RPC
 * (SECURITY INVOKER, so RLS enforces ownership). Returns the new recipe's id.
 */
export async function createRecipe(
  supabase: SupabaseClient,
  payload: CreateRecipePayload
): Promise<string> {
  const { data: recipeId, error } = await supabase.rpc("create_recipe", {
    p_name: payload.name,
    p_steps: payload.steps,
    p_servings: payload.servings,
    p_image_url: payload.image_url,
    p_created_by: payload.created_by,
    p_ingredients: payload.ingredients,
  });
  if (error) throw error;
  return recipeId as string;
}

export interface UpdateRecipePayload {
  name: string;
  steps: string[];
  servings: number;
  image_url: string | null;
  ingredients: PayloadIngredient[];
}

/**
 * Update a recipe and replace its ingredients, then propagate the change.
 *
 * The recipe row + ingredient rows are rewritten atomically by the
 * `replace_recipe` RPC (SECURITY INVOKER, so RLS enforces ownership). The two
 * side effects that can't live in that transaction run here afterward:
 *
 * - `admin` regenerates every grocery list that references this recipe —
 *   editing ingredients OR servings changes aggregated quantities, and those
 *   lists may belong to other users whose rows the caller's RLS can't see
 *   (mirrors `deleteRecipe`). We always regenerate rather than diffing.
 * - A best-effort Storage cleanup of the old photo when the image changed,
 *   swallowed like the delete path (an orphaned object beats a broken flow).
 */
export async function updateRecipe(
  supabase: SupabaseClient,
  admin: SupabaseClient,
  recipeId: string,
  payload: UpdateRecipePayload
): Promise<void> {
  const { data: existing, error: fetchError } = await supabase
    .from("recipes")
    .select("id, image_url, created_by")
    .eq("id", recipeId)
    .maybeSingle();
  if (fetchError) throw fetchError;
  if (!existing) throw new Error("Recipe not found");

  const { error: rpcError } = await supabase.rpc("replace_recipe", {
    p_recipe_id: recipeId,
    p_name: payload.name,
    p_steps: payload.steps,
    p_servings: payload.servings,
    p_image_url: payload.image_url,
    p_ingredients: payload.ingredients,
  });
  if (rpcError) {
    // no_data_found is raised inside the RPC when RLS blocks the UPDATE
    // (caller doesn't own the recipe) — surface it as a clean 404.
    if (rpcError.code === "P0002") throw new Error("Recipe not found");
    throw rpcError;
  }

  // Regenerate every list that references this recipe (cross-user → admin).
  const { data: affectedLists, error: affectedError } = await admin
    .from("grocery_list_recipes")
    .select("grocery_list_id")
    .eq("recipe_id", recipeId);
  if (affectedError) throw affectedError;

  const listIds = [
    ...new Set((affectedLists ?? []).map((row) => row.grocery_list_id)),
  ];
  // Per-list try/catch: one bad list must not abort regeneration of the rest.
  for (const listId of listIds) {
    try {
      await regenerateGroceryListItems(admin, listId);
    } catch (err) {
      console.error(`Failed to regenerate grocery list ${listId}:`, err);
    }
  }

  // Clean up the old photo only when the image actually changed.
  if (existing.image_url && existing.image_url !== payload.image_url) {
    const path = existing.image_url.replace(/^.*?\/recipe-photos\//, "");
    if (path && existing.image_url.includes("/recipe-photos/")) {
      const { error: storageError } = await supabase.storage
        .from("recipe-photos")
        .remove([path]);
      if (storageError) {
        console.error("Failed to delete old recipe photo:", storageError);
      }
    }
  }
}
