import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { fetchRecipeDetails, type RecipeWithIngredients } from "../api";

export const useRecipeDetails = (
  recipeId: string,
  initialData?: RecipeWithIngredients
) => {
  return useQuery({
    queryKey: ["recipe-details", recipeId],
    queryFn: () => fetchRecipeDetails(supabase, recipeId),
    enabled: !!recipeId,
    initialData,
    staleTime: initialData ? 30_000 : 0,
  });
};
