import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../../supabase/supabase-client";
import type { GroceryListFull } from "../../types/grocery-list";
import { GROCERY_LIST_QUERY_KEYS } from "./query-keys";

// Toggle grocery list item checked status with optimistic updates
export const useToggleGroceryListItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      itemId,
      isChecked,
    }: {
      itemId: string;
      isChecked: boolean;
      listId: string;
    }) => {
      const { data, error } = await supabase
        .from("grocery_list_items")
        .update({ is_checked: isChecked, updated_at: new Date().toISOString() })
        .eq("id", itemId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async ({ itemId, isChecked, listId }) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({
        queryKey: GROCERY_LIST_QUERY_KEYS.groceryList(listId),
      });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData<GroceryListFull>(
        GROCERY_LIST_QUERY_KEYS.groceryList(listId)
      );

      // Optimistically update the cache
      queryClient.setQueryData<GroceryListFull>(
        GROCERY_LIST_QUERY_KEYS.groceryList(listId),
        (old) => {
          if (!old) return old;

          return {
            ...old,
            items: old.items.map((item) =>
              item.id === itemId ? { ...item, is_checked: isChecked } : item
            ),
          };
        }
      );

      // Return a context object with the snapshotted value
      return { previousData, listId };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(
          GROCERY_LIST_QUERY_KEYS.groceryList(context.listId),
          context.previousData
        );
      }
    },
    onSettled: (_, __, { listId }) => {
      // Always refetch after mutation (success or error) to ensure consistency
      queryClient.invalidateQueries({
        queryKey: GROCERY_LIST_QUERY_KEYS.groceryList(listId),
      });
    },
  });
};

// Add manual item to grocery list
export const useAddManualItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      listId,
      ingredientName,
      quantity,
      unitName,
      notes,
    }: {
      listId: string;
      ingredientName: string;
      quantity: number;
      unitName: string;
      notes?: string | null;
    }) => {
      const { data, error } = await supabase.rpc(
        "add_manual_item_to_grocery_list",
        {
          list_id: listId,
          ingredient_name: ingredientName,
          quantity,
          unit_name: unitName,
          notes: notes || undefined,
        }
      );

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

// Remove grocery list item
export const useRemoveGroceryListItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from("grocery_list_items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      // Find which grocery list this item belonged to and invalidate its cache
      queryClient.invalidateQueries({
        queryKey: GROCERY_LIST_QUERY_KEYS.groceryLists,
      });

      // Also invalidate all grocery list detail queries since we don't know which list this item was from
      queryClient.invalidateQueries({
        queryKey: ["grocery-list"],
      });
    },
    onError: (error) => {
      console.error("Error removing grocery list item", error);
    },
  });
};
