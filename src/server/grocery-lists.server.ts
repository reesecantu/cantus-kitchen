import type { SupabaseClient } from "@supabase/supabase-js";
import {
  aggregateGroceryItems,
  type RecipeForAggregation,
  type UnitInfo,
} from "./grocery-aggregation";
import { createSupabaseAdminClient } from "./supabase-admin.server";

/**
 * Server-side replacement for the Postgres trigger that regenerated grocery
 * list items. Writes use the caller's cookie-scoped Supabase client, so RLS
 * remains the authorization layer — a user can only touch lists they own or
 * have joined. Regeneration alone runs on the admin client (see below).
 */

/**
 * RLS hides lists the user neither owns nor has joined, so a returned row
 * means "owner or member" (compare `user_id` to tell which); null lets routes
 * return a clean 404 instead of silently writing zero rows.
 */
export async function getAccessibleList(
  supabase: SupabaseClient,
  listId: string
): Promise<{ user_id: string } | null> {
  const { data, error } = await supabase
    .from("grocery_lists")
    .select("user_id")
    .eq("id", listId)
    .maybeSingle();

  // 22P02: listId isn't a uuid, so no such list
  if (error?.code === "22P02") return null;
  if (error) throw error;
  return data;
}

/**
 * Recompute all generated (non-manual) items for a list from its linked
 * recipes. Replaces `regenerate_grocery_list_items` + its trigger; the final
 * delete+insert goes through the atomic `replace_generated_grocery_list_items`
 * RPC so readers never observe a half-written list.
 *
 * Call it after the input mutation commits. It takes a ticket before reading
 * inputs, and the RPC skips the write if a later-ticketed regeneration already
 * wrote, so concurrent calls can't leave items built from a stale snapshot.
 *
 * `supabase` must be the admin client (and the caller's access already
 * checked): on a shared list a user client can't see another member's private
 * recipe, and its null `recipes(servings)` would throw below.
 */
export async function regenerateGroceryListItems(
  supabase: SupabaseClient,
  listId: string
): Promise<void> {
  // Units don't depend on the ticket; fetch them alongside it.
  const [{ data: generation, error: generationError }, units] =
    await Promise.all([
      supabase.rpc("begin_grocery_list_regeneration"),
      fetchUnits(supabase),
    ]);
  if (generationError) throw generationError;

  const { data: listRecipes, error: listRecipesError } = await supabase
    .from("grocery_list_recipes")
    .select("recipe_id, servings_multiplier, recipes(servings)")
    .eq("grocery_list_id", listId);
  if (listRecipesError) throw listRecipesError;

  const recipeIds = (listRecipes ?? []).map((lr) => lr.recipe_id);

  let recipes: RecipeForAggregation[] = [];
  if (recipeIds.length > 0) {
    const { data: recipeIngredients, error: ingredientsError } = await supabase
      .from("recipe_ingredients")
      .select("recipe_id, ingredient_id, unit_amount, unit_id, note")
      .in("recipe_id", recipeIds);
    if (ingredientsError) throw ingredientsError;

    recipes = (listRecipes ?? []).map((lr) => ({
      recipeId: lr.recipe_id,
      servingsMultiplier: lr.servings_multiplier,
      // PostgREST returns the many-to-one join as an object; the untyped
      // client can't tell, so it infers an array
      originalServings: (Array.isArray(lr.recipes) ? lr.recipes[0] : lr.recipes)
        .servings,
      ingredients: (recipeIngredients ?? [])
        .filter((ri) => ri.recipe_id === lr.recipe_id)
        .map((ri) => ({
          ingredientId: ri.ingredient_id,
          unitAmount: ri.unit_amount,
          unitId: ri.unit_id,
          note: ri.note,
        })),
    }));
  }

  const items = aggregateGroceryItems(recipes, units);

  const { error: replaceError } = await supabase.rpc(
    "replace_generated_grocery_list_items",
    { p_list_id: listId, p_items: items, p_generation: generation }
  );
  if (replaceError) throw replaceError;
}

/**
 * Port of `add_recipe_to_grocery_list`: upsert the link, then regenerate.
 *
 * The link write runs on the caller's client (RLS checks list access and that
 * the recipe is visible to them). Regeneration runs on the admin client
 * because a shared list can hold another member's private recipe, which the
 * caller's RLS hides — callers must check list access before calling this.
 */
export async function addRecipeToGroceryList(
  supabase: SupabaseClient,
  args: { listId: string; recipeId: string; servingsMultiplier?: number }
): Promise<void> {
  const { error } = await supabase.from("grocery_list_recipes").upsert(
    {
      grocery_list_id: args.listId,
      recipe_id: args.recipeId,
      servings_multiplier: args.servingsMultiplier ?? 1.0,
    },
    { onConflict: "grocery_list_id,recipe_id" }
  );
  // 42501: the restrictive insert policy (caller can't see the recipe, or it
  // doesn't exist). 22P02: recipeId isn't a uuid.
  if (error?.code === "42501" || error?.code === "22P02") {
    throw new Error("Recipe not found");
  }
  if (error) throw error;

  await regenerateGroceryListItems(createSupabaseAdminClient(), args.listId);
}

/** Same client split as addRecipeToGroceryList. */
export async function removeRecipeFromGroceryList(
  supabase: SupabaseClient,
  args: { listId: string; recipeId: string }
): Promise<void> {
  const { error } = await supabase
    .from("grocery_list_recipes")
    .delete()
    .eq("grocery_list_id", args.listId)
    .eq("recipe_id", args.recipeId);
  if (error) throw error;

  await regenerateGroceryListItems(createSupabaseAdminClient(), args.listId);
}

/**
 * Set (share / regenerate) or clear (stop sharing) a list's share token. The
 * guard trigger rejects non-owners with 42501; routes pre-check ownership for
 * a clean 403.
 */
export async function setShareToken(
  supabase: SupabaseClient,
  listId: string,
  shareToken: string | null
): Promise<void> {
  const { error } = await supabase
    .from("grocery_lists")
    .update({ share_token: shareToken })
    .eq("id", listId);
  if (error) throw error;
}

/**
 * Port of `add_manual_item_to_grocery_list`: match a known ingredient
 * case-insensitively (fall back to a free-text manual_name), require the unit
 * to exist, insert the manual item. Returns the new item id.
 */
export async function addManualItem(
  supabase: SupabaseClient,
  args: {
    listId: string;
    ingredientName: string;
    quantity: number;
    unitName: string;
    notes?: string | null;
  }
): Promise<string> {
  // Case-insensitive exact match. Escape LIKE metacharacters so user input
  // like "2% milk" doesn't act as a wildcard pattern, and limit(1) for parity
  // with the old SQL's SELECT INTO, which silently took the first row if the
  // name still matched more than one ingredient (e.g. case variants).
  const escapedName = args.ingredientName.replace(/[\\%_]/g, "\\$&");
  const { data: ingredient, error: ingredientError } = await supabase
    .from("ingredients")
    .select("id")
    .ilike("name", escapedName)
    .limit(1)
    .maybeSingle();
  if (ingredientError) throw ingredientError;

  let unitId: string | null = null;
  if (args.unitName.trim()) {
    const { data: unit, error: unitError } = await supabase
      .from("units")
      .select("id")
      .eq("name", args.unitName)
      .maybeSingle();
    if (unitError) throw unitError;
    if (!unit) throw new Error(`Unit "${args.unitName}" not found`);
    unitId = unit.id;
  }

  const { data: item, error: insertError } = await supabase
    .from("grocery_list_items")
    .insert({
      grocery_list_id: args.listId,
      ingredient_id: ingredient?.id ?? null,
      quantity: args.quantity,
      unit_id: unitId,
      notes: args.notes ?? null,
      is_manual: true,
      manual_name: ingredient ? null : args.ingredientName,
      source_recipes: [],
    })
    .select("id")
    .single();
  if (insertError) throw insertError;

  return item.id;
}

async function fetchUnits(supabase: SupabaseClient): Promise<UnitInfo[]> {
  const { data, error } = await supabase
    .from("units")
    .select("id, name, type, system, base_conversion_factor");
  if (error) throw error;

  return (data ?? []).map((u) => ({
    id: u.id,
    name: u.name,
    type: u.type,
    system: u.system,
    baseConversionFactor: u.base_conversion_factor,
  }));
}
