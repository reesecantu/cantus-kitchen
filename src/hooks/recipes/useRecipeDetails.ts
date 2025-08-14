import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../supabase/supabase-client';
import type { Tables } from '../../types/database-types';

interface RecipeIngredientWithDetails {
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
interface RecipeIngredientJoined extends Tables<'recipe_ingredients'> {
  ingredients: { name: string } | null;
  units: { name: string; abbreviation: string } | null;
}

interface RecipeWithIngredients extends Tables<'recipes'> {
  ingredients: RecipeIngredientWithDetails[];
}

export const useRecipeDetails = (recipeId: string) => {
  return useQuery({
    queryKey: ['recipe-details', recipeId],
    queryFn: async (): Promise<RecipeWithIngredients> => {
      const { data, error } = await supabase
        .from('recipes')
        .select(`
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
        `)
        .eq('id', recipeId)
        .single();

      if (error) {
        console.error('Error fetching recipe details:', error);
        throw error;
      }

      return {
        ...data,
        ingredients: (data.recipe_ingredients || []).map((ri: RecipeIngredientJoined) => ({
          id: ri.id,
          ingredient_id: ri.ingredient_id,
          unit_amount: ri.unit_amount,
          unit_id: ri.unit_id,
          note: ri.note,
          ingredient_name: ri.ingredients?.name || 'Unknown Ingredient',
          unit_name: ri.units?.name || '',
          unit_abbreviation: ri.units?.abbreviation || '',
        }))
      };
    },
    enabled: !!recipeId,
  });
};