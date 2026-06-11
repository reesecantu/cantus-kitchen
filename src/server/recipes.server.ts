import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Delete a recipe row (RLS-checked via the user's client) and clean up its
 * photo in Storage — replaces the `trg_enqueue_recipe_photo_delete` trigger
 * and its never-drained storage_delete_jobs queue. A failed photo delete is
 * logged and swallowed: an orphaned object is acceptable, a broken delete
 * flow is not.
 */
export async function deleteRecipe(
  supabase: SupabaseClient,
  recipeId: string
): Promise<void> {
  const { data: recipe, error: fetchError } = await supabase
    .from("recipes")
    .select("id, image_url")
    .eq("id", recipeId)
    .maybeSingle();
  if (fetchError) throw fetchError;
  if (!recipe) throw new Error("Recipe not found");

  const { error: deleteError } = await supabase
    .from("recipes")
    .delete()
    .eq("id", recipeId);
  if (deleteError) throw deleteError;

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
