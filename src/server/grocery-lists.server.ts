import type { SupabaseClient } from "@supabase/supabase-js";
import {
  aggregateGroceryItems,
  type RecipeForAggregation,
  type UnitInfo,
} from "./grocery-aggregation";

/**
 * Server-side replacement for the Postgres trigger that regenerated grocery
 * list items. Every function takes the caller's cookie-scoped Supabase client,
 * so RLS remains the authorization layer — a user can only touch lists they own.
 */

/**
 * RLS hides lists the user doesn't own, so "visible" means "owned". Lets
 * routes return a clean 404 instead of silently writing zero rows.
 */
export async function ownsList(
  supabase: SupabaseClient,
  listId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("grocery_lists")
    .select("id")
    .eq("id", listId)
    .maybeSingle();

  if (error) throw error;
  return data !== null;
}

/**
 * Recompute all generated (non-manual) items for a list from its linked
 * recipes. Replaces `regenerate_grocery_list_items` + its trigger; the final
 * delete+insert goes through the atomic `replace_generated_grocery_list_items`
 * RPC so readers never observe a half-written list.
 */
export async function regenerateGroceryListItems(
  supabase: SupabaseClient,
  listId: string
): Promise<void> {
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

  const units = await fetchUnits(supabase);
  const items = aggregateGroceryItems(recipes, units);

  const { error: replaceError } = await supabase.rpc(
    "replace_generated_grocery_list_items",
    { p_list_id: listId, p_items: items }
  );
  if (replaceError) throw replaceError;
}

/** Port of `add_recipe_to_grocery_list`: upsert the link, then regenerate. */
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
  if (error) throw error;

  await regenerateGroceryListItems(supabase, args.listId);
}

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

  await regenerateGroceryListItems(supabase, args.listId);
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
  // ILIKE without wildcards = case-insensitive exact match (as in the SQL)
  const { data: ingredient, error: ingredientError } = await supabase
    .from("ingredients")
    .select("id")
    .ilike("name", args.ingredientName)
    .maybeSingle();
  if (ingredientError) throw ingredientError;

  const { data: unit, error: unitError } = await supabase
    .from("units")
    .select("id")
    .eq("name", args.unitName)
    .maybeSingle();
  if (unitError) throw unitError;
  if (!unit) throw new Error(`Unit "${args.unitName}" not found`);

  const { data: item, error: insertError } = await supabase
    .from("grocery_list_items")
    .insert({
      grocery_list_id: args.listId,
      ingredient_id: ingredient?.id ?? null,
      quantity: args.quantity,
      unit_id: unit.id,
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
    .select("id, type, system, base_conversion_factor, cooking_priority");
  if (error) throw error;

  return (data ?? []).map((u) => ({
    id: u.id,
    type: u.type,
    system: u.system,
    baseConversionFactor: u.base_conversion_factor,
    cookingPriority: u.cooking_priority,
  }));
}
