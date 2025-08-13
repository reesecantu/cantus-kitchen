import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../supabase/supabase-client'
import type { TablesInsert } from '../types/database-types';

interface RecipeIngredientForDB {
  ingredient_id: number;
  unit_id?: string | null;
  unit_amount?: number | null; 
  note?: string | null;
}

interface RecipeWithIngredients {
  recipe: Omit<TablesInsert<'recipes'>, 'id' | 'image_url'>;
  ingredients: RecipeIngredientForDB[];
  imageFile?: File;
  imageUrl?: string; // Add imageUrl parameter
}

export const useCreateRecipe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ recipe, ingredients, imageFile, imageUrl }: RecipeWithIngredients) => {
      let finalImageUrl: string | null = null;

      // if imageUrl is provided, use it directly
      if (imageUrl) {
        finalImageUrl = imageUrl;
      } 
      // Otherwise, upload file if provided
      else if (imageFile) {
        // Clean the filename and recipe name for the path
        const cleanFileName = imageFile.name
          .replace(/[^a-zA-Z0-9.-]/g, "_")
          .toLowerCase();
        
        const cleanRecipeName = recipe.name
          .replace(/[^a-zA-Z0-9]/g, "_")
          .toLowerCase();

        const filePath = `${cleanRecipeName}-${Date.now()}-${cleanFileName}`;

        // Upload to Supabase storage
        const { error: uploadError } = await supabase.storage
          .from("recipe-photos")
          .upload(filePath, imageFile);

        if (uploadError) {
          console.error('Image upload error:', uploadError);
          throw new Error(`Failed to upload image: ${uploadError.message}`);
        }

        // Get the public URL
        const { data: publicUrlData } = supabase.storage
          .from("recipe-photos")
          .getPublicUrl(filePath);

        finalImageUrl = publicUrlData.publicUrl;
      }

      // Create the recipe with the final image URL
      const { data: recipeData, error: recipeError } = await supabase
        .from('recipes')
        .insert({
          name: recipe.name,
          steps: recipe.steps,
          image_url: finalImageUrl,
          created_by: recipe.created_by,
          servings: recipe.servings
        })
        .select()
        .single();

      if (recipeError) throw recipeError;

      if (ingredients.length > 0) {
        const recipeIngredients = ingredients.map(ing => ({
          recipe_id: recipeData.id,
          ingredient_id: ing.ingredient_id,
          unit_id: ing.unit_id || null,
          unit_amount: ing.unit_amount || null, 
          note: ing.note || null,
        }));

        const { error: ingredientsError } = await supabase
          .from('recipe_ingredients')
          .insert(recipeIngredients);

        if (ingredientsError) throw ingredientsError;
      } else {
        throw Error("There should be at least one ingredient in the recipe")
      }

      return recipeData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
    },
  });
};