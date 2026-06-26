import type { SupabaseClient } from "@supabase/supabase-js";
import type { Tables } from "@/types/database-types";

export interface RecipeIngredientWithDetails {
  id: number;
  ingredient_id: number;
  unit_amount: number | null;
  unit_id: string | null;
  note: string | null;
  group_label: string | null;
  position: number;
  ingredient_name: string;
  unit_name: string;
  unit_abbreviation: string;
}

// Type for the joined query result from Supabase
interface RecipeIngredientJoined extends Tables<"recipe_ingredients"> {
  ingredients: { name: string } | null;
  units: { name: string; abbreviation: string } | null;
}

export interface RecipeWithIngredients extends Tables<"recipes"> {
  ingredients: RecipeIngredientWithDetails[];
}

export interface UnitDisplayInfo {
  id: string;
  type: string;
  system: string;
  baseConversionFactor: number | null;
  name: string;
  abbreviation: string;
}

export async function fetchUnitsForDisplay(
  client: SupabaseClient
): Promise<UnitDisplayInfo[]> {
  const { data, error } = await client
    .from("units")
    .select(
      "id, type, system, base_conversion_factor, name, abbreviation"
    );
  if (error) throw error;
  return (data ?? []).map((u) => ({
    id: u.id,
    type: u.type,
    system: u.system,
    baseConversionFactor: u.base_conversion_factor,
    name: u.name,
    abbreviation: u.abbreviation,
  }));
}

// Shared between the TanStack Query hooks (browser client) and the route
// loaders (per-request server client), so SSR and client render identical
// data. Replaces the get_public_recipes / get_public_and_user_recipes RPCs:
// the public catalog plus the signed-in user's own recipes.
export async function fetchRecipes(
  client: SupabaseClient,
  userId: string | null
): Promise<Tables<"recipes">[]> {
  let query = client
    .from("recipes")
    .select("id, name, image_url, created_by, steps, servings, created_at")
    .order("created_at", { ascending: false });

  query = userId
    ? query.or(`is_public.eq.true,created_by.eq.${userId}`)
    : query.eq("is_public", true);

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching recipes:", error);
    throw error;
  }

  return (data || []) as Tables<"recipes">[];
}

export async function fetchRecipeDetails(
  client: SupabaseClient,
  recipeId: string
): Promise<RecipeWithIngredients> {
  const { data, error } = await client
    .from("recipes")
    .select(
      `
      *,
      recipe_ingredients (
        id,
        ingredient_id,
        unit_amount,
        unit_id,
        note,
        group_label,
        position,
        ingredients (name),
        units (name, abbreviation)
      )
    `
    )
    .eq("id", recipeId)
    .order("position", { referencedTable: "recipe_ingredients", ascending: true })
    // Tiebreaker: pre-migration rows all default to position 0, so without a
    // secondary key their order is non-deterministic. Ordering by the primary
    // key reproduces the stable insertion order the old query returned.
    .order("id", { referencedTable: "recipe_ingredients", ascending: true })
    .single();

  if (error) {
    console.error("Error fetching recipe details:", error);
    throw error;
  }

  return {
    ...data,
    ingredients: (data.recipe_ingredients || []).map(
      (ri: RecipeIngredientJoined) => ({
        id: ri.id,
        ingredient_id: ri.ingredient_id,
        unit_amount: ri.unit_amount,
        unit_id: ri.unit_id,
        note: ri.note,
        group_label: ri.group_label,
        position: ri.position,
        ingredient_name: ri.ingredients?.name || "Unknown Ingredient",
        unit_name: ri.units?.name || "",
        unit_abbreviation: ri.units?.abbreviation || "",
      })
    ),
  };
}
