import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { TablesInsert } from "@/types/database-types";

interface RecipeIngredientForDB {
  ingredient_id: number;
  unit_id?: string | null;
  unit_amount?: number | null;
  note?: string | null;
}

interface RecipeWithIngredients {
  recipe: Omit<TablesInsert<"recipes">, "id" | "image_url">;
  ingredients: RecipeIngredientForDB[];
  imageFile?: File;
  imageUrl?: string; // Add imageUrl parameter
}

/**
 * Upload a recipe photo to the `recipe-photos` bucket and return its public
 * URL. Shared by create and edit — both let the browser do the upload (the
 * anon client can write to the bucket) and pass the resulting URL to the row
 * write.
 */
async function uploadRecipeImage(
  imageFile: File,
  recipeName: string
): Promise<string> {
  const cleanFileName = imageFile.name
    .replace(/[^a-zA-Z0-9.-]/g, "_")
    .toLowerCase();
  const cleanRecipeName = recipeName.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
  const filePath = `${cleanRecipeName}-${Date.now()}-${cleanFileName}`;

  const { error: uploadError } = await supabase.storage
    .from("recipe-photos")
    .upload(filePath, imageFile);
  if (uploadError) {
    console.error("Image upload error:", uploadError);
    throw new Error(`Failed to upload image: ${uploadError.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from("recipe-photos")
    .getPublicUrl(filePath);
  return publicUrlData.publicUrl;
}

export const useCreateRecipe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      recipe,
      ingredients,
      imageFile,
      imageUrl,
    }: RecipeWithIngredients) => {
      let finalImageUrl: string | null = null;

      // if imageUrl is provided, use it directly
      if (imageUrl) {
        finalImageUrl = imageUrl;
      }
      // Otherwise, upload file if provided
      else if (imageFile) {
        finalImageUrl = await uploadRecipeImage(imageFile, recipe.name);
      }

      // Create the recipe with the final image URL
      const { data: recipeData, error: recipeError } = await supabase
        .from("recipes")
        .insert({
          name: recipe.name,
          steps: recipe.steps,
          image_url: finalImageUrl,
          created_by: recipe.created_by,
          servings: recipe.servings,
        })
        .select()
        .single();

      if (recipeError) throw recipeError;

      if (ingredients.length > 0) {
        const recipeIngredients = ingredients.map((ing) => ({
          recipe_id: recipeData.id,
          ingredient_id: ing.ingredient_id,
          unit_id: ing.unit_id,
          unit_amount: ing.unit_amount || null,
          note: ing.note || null,
        }));

        const { error: ingredientsError } = await supabase
          .from("recipe_ingredients")
          .insert(recipeIngredients);

        if (ingredientsError) throw ingredientsError;
      } else {
        throw Error("There should be at least one ingredient in the recipe");
      }

      return recipeData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
    },
  });
};

interface UpdateRecipeArgs {
  recipeId: string;
  recipe: {
    name: string;
    steps: string[];
    servings: number;
  };
  ingredients: RecipeIngredientForDB[];
  imageFile?: File;
  // Either a freshly chosen URL or the recipe's existing image_url to keep it.
  imageUrl?: string;
}

/**
 * Edit a recipe. Resolves the final image URL client-side (new URL, a freshly
 * uploaded file, or the unchanged existing URL passed through), then PUTs to
 * the server route which rewrites the row + ingredients atomically and
 * regenerates affected grocery lists.
 */
export const useUpdateRecipe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      recipeId,
      recipe,
      ingredients,
      imageFile,
      imageUrl,
    }: UpdateRecipeArgs) => {
      let finalImageUrl: string | null = null;
      if (imageUrl) {
        finalImageUrl = imageUrl;
      } else if (imageFile) {
        finalImageUrl = await uploadRecipeImage(imageFile, recipe.name);
      }

      const response = await fetch(`/api/recipes/${recipeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: recipe.name,
          steps: recipe.steps,
          servings: recipe.servings,
          image_url: finalImageUrl,
          ingredients: ingredients.map((ing) => ({
            ingredient_id: ing.ingredient_id,
            unit_id: ing.unit_id ?? null,
            unit_amount: ing.unit_amount || null,
            note: ing.note || null,
          })),
        }),
      });

      if (!response.ok) {
        const message = await response
          .json()
          .then((b) => b?.message)
          .catch(() => null);
        throw new Error(message || "Failed to update recipe");
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      queryClient.invalidateQueries({
        queryKey: ["recipe-details", variables.recipeId],
      });
      // Editing ingredients or servings changes aggregated grocery list
      // quantities — the server regenerates them, so flush the client cache.
      queryClient.invalidateQueries({ queryKey: ["grocery-list-items"] });
    },
  });
};

/** Delete a recipe via the server route (RLS-checked, cleans up the photo). */
export const useDeleteRecipe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (recipeId: string) => {
      const response = await fetch(`/api/recipes/${recipeId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const message = await response
          .json()
          .then((b) => b?.message)
          .catch(() => null);
        throw new Error(message || "Failed to delete recipe");
      }
    },
    onSuccess: (_data, recipeId) => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      queryClient.invalidateQueries({ queryKey: ["recipe-details", recipeId] });
    },
  });
};
