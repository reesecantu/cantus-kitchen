import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../../supabase/supabase-client";
import { GROCERY_LIST_QUERY_KEYS } from "./query-keys";

// Add recipe to grocery list
export const useAddRecipeToGroceryList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      listId,
      recipeId,
      servingsMultiplier = 1.0,
    }: {
      listId: string;
      recipeId: string;
      servingsMultiplier?: number;
    }) => {
      const { data, error } = await supabase.rpc("add_recipe_to_grocery_list", {
        list_id: listId,
        p_recipe_id: recipeId,
        servings_multiplier: servingsMultiplier,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: GROCERY_LIST_QUERY_KEYS.groceryList(variables.listId),
      });
    },
  });
};

// Remove recipe from grocery list
export const useRemoveRecipeFromGroceryList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      listId,
      recipeId,
    }: {
      listId: string;
      recipeId: string;
    }) => {
      const { error } = await supabase
        .from("grocery_list_recipes")
        .delete()
        .eq("grocery_list_id", listId)
        .eq("recipe_id", recipeId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: GROCERY_LIST_QUERY_KEYS.groceryList(variables.listId),
      });
    },
  });
};