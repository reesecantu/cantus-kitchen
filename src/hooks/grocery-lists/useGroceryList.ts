import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GROCERY_LIST_QUERY_KEYS } from "./query-keys";
import type {
  GroceryListFull,
  GroceryListItemTransformed,
  GroceryListItemWithRelations,
  GroceryListRecipeWithRecipe,
} from "../../types/grocery-list";
import { supabase } from "../../../supabase/supabase-client";

// Fetch single grocery list with full details
export const useGroceryList = (listId: string) => {
  return useQuery({
    queryKey: GROCERY_LIST_QUERY_KEYS.groceryList(listId),
    queryFn: async (): Promise<GroceryListFull> => {
      const { data, error } = await supabase
        .from("grocery_lists")
        .select(
          `
          *,
          grocery_list_recipes (
            *,
            recipes (name)
          ),
          grocery_list_items (
            *,
            ingredients (
              name,
              grocery_aisle_id,
              grocery_aisles (name, display_order)
            ),
            units (name, abbreviation)
          )
        `
        )
        .eq("id", listId)
        .order("created_at", {
          referencedTable: "grocery_list_items",
          ascending: true,
        }) // Add this line
        .single();

      if (error) {
        console.error("Error fetching grocery list:", error);
        throw error;
      }

      return {
        ...data,
        recipes: (data.grocery_list_recipes || []).map(
          (glr: GroceryListRecipeWithRecipe) => ({
            ...glr,
            recipe_name: glr.recipes?.name || "Unknown Recipe",
          })
        ),
        items: (data.grocery_list_items || [])
          .map(
            (
              item: GroceryListItemWithRelations
            ): GroceryListItemTransformed => ({
              ...item,
              ingredient_name:
                item.ingredients?.name ||
                item.manual_name ||
                "Unknown Ingredient",
              unit_name: item.units?.name || "",
              unit_abbreviation: item.units?.abbreviation || "",
              grocery_aisle_id: item.ingredients?.grocery_aisle_id || 0,
              grocery_aisle_name:
                item.ingredients?.grocery_aisles?.name || "Other",
              grocery_aisle_display_order:
                item.ingredients?.grocery_aisles?.display_order || 999,
            })
          )
          .sort(
            (a: GroceryListItemTransformed, b: GroceryListItemTransformed) => {
              // First sort by aisle display order
              if (
                a.grocery_aisle_display_order !== b.grocery_aisle_display_order
              ) {
                return (
                  a.grocery_aisle_display_order - b.grocery_aisle_display_order
                );
              }
              // Then by creation time within the same aisle
              return (
                new Date(a.created_at || "").getTime() -
                new Date(b.created_at || "").getTime()
              );
            }
          ),
      };
    },
    enabled: !!listId,
  });
};

export const useUpdateGroceryList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      listId,
      updates,
    }: {
      listId: string;
      updates: { name?: string; description?: string };
    }) => {
      const { data, error } = await supabase
        .from("grocery_lists")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", listId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: GROCERY_LIST_QUERY_KEYS.groceryList(data.id),
      });
      queryClient.invalidateQueries({
        queryKey: GROCERY_LIST_QUERY_KEYS.groceryLists,
      });
    },
  });
};

// Delete grocery list
export const useDeleteGroceryList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (listId: string) => {
      const { error } = await supabase
        .from("grocery_lists")
        .delete()
        .eq("id", listId);

      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      // Invalidate grocery lists query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["grocery-lists"] });
    },
    onError: (error) => {
      console.error("Error deleting grocery list:", error);
    },
  });
};
