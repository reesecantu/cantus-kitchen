import type { SupabaseClient } from "@supabase/supabase-js";
import type { Tables } from "@/types/database-types";

export interface RecipeIngredientWithDetails {
  id: number;
  ingredient_id: number;
  unit_amount: number | null;
  unit_id: string | null;
  note: string | null;
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

// Shared between the TanStack Query hooks (browser client) and the route
// loaders (per-request server client), so SSR and client render identical data.
export async function fetchRecipes(
  client: SupabaseClient
): Promise<Tables<"recipes">[]> {
  const { data, error } = await client
    .rpc("get_public_and_user_recipes")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching recipes:", error);
    throw error;
  }

  return data || [];
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
        ingredients (name),
        units (name, abbreviation)
      )
    `
    )
    .eq("id", recipeId)
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
        ingredient_name: ri.ingredients?.name || "Unknown Ingredient",
        unit_name: ri.units?.name || "",
        unit_abbreviation: ri.units?.abbreviation || "",
      })
    ),
  };
}
