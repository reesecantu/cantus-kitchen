import { useMutation, useQueryClient } from "@tanstack/react-query";
import { GROCERY_LIST_QUERY_KEYS } from "./query-keys";

async function mutateListRecipe(
  listId: string,
  method: "POST" | "DELETE",
  body: { recipeId: string; servingsMultiplier?: number }
) {
  const response = await fetch(`/api/grocery-lists/${listId}/recipes`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.message ?? "Failed to update grocery list");
  }
}

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
      await mutateListRecipe(listId, "POST", { recipeId, servingsMultiplier });
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
      await mutateListRecipe(listId, "DELETE", { recipeId });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: GROCERY_LIST_QUERY_KEYS.groceryList(variables.listId),
      });
    },
  });
};
