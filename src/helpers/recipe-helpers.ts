import supabase from "../../supabase/supabase-client";
import { RecipeType } from "../../supabase/supabase-types";

export async function getRecipe(recipeId: number): Promise<RecipeType | null> {
  const { data, error } = await supabase
    .from("recipe")
    .select("*")
    .eq("id", recipeId)
    .single();

  if (error) {
    console.error("Error fetching recipe:", error);
    return null;
  } else {
    return data;
  }
}

export async function insertRecipe(
  recipe: Omit<RecipeType, "id" | "created_at">
): Promise<void | null> {
  const { data, error } = await supabase.from("recipe").insert(recipe);

  if (error) {
    console.error("Error inserting recipe:", error);
    return null;
  }

  return console.log("Inserted recipe:", data);
}

export async function deleteRecipe(recipeId: number): Promise<boolean> {
  const { error } = await supabase.from("recipe").delete().eq("id", recipeId);

  if (error) {
    console.error("Error deleting recipe:", error);
    return false;
  }

  return true;
}
