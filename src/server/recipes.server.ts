import type { SupabaseClient } from "@supabase/supabase-js";
import { regenerateGroceryListItems } from "./grocery-lists.server";

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

  const listIds = [
    ...new Set((affectedLists ?? []).map((row) => row.grocery_list_id)),
  ];
  for (const listId of listIds) {
    await regenerateGroceryListItems(admin, listId);
  }

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
}
