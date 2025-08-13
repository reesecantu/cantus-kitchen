import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "../../../supabase/supabase-client";
import type {
  GroceryListFull,
  GroceryListWithStats,
} from "../../types/grocery-list";
import { GROCERY_LIST_QUERY_KEYS } from "./query-keys";

// Update grocery list completion status with optimistic updates
const useUpdateGroceryListCompletion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      listId,
      isCompleted,
    }: {
      listId: string;
      isCompleted: boolean;
    }) => {
      const { data, error } = await supabase
        .from("grocery_lists")
        .update({
          is_completed: isCompleted,
          updated_at: new Date().toISOString(),
        })
        .eq("id", listId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async ({ listId, isCompleted }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({
        queryKey: GROCERY_LIST_QUERY_KEYS.groceryList(listId),
      });
      await queryClient.cancelQueries({
        queryKey: GROCERY_LIST_QUERY_KEYS.groceryLists,
      });

      // Snapshot previous values
      const previousListData = queryClient.getQueryData(
        GROCERY_LIST_QUERY_KEYS.groceryList(listId)
      );
      const previousListsData = queryClient.getQueryData(
        GROCERY_LIST_QUERY_KEYS.groceryLists
      );

      // Optimistically update the specific grocery list
      queryClient.setQueryData(
        GROCERY_LIST_QUERY_KEYS.groceryList(listId),
        (old: GroceryListFull | undefined) => {
          if (!old) return old;
          return { ...old, is_completed: isCompleted };
        }
      );

      // Optimistically update the grocery lists overview
      queryClient.setQueryData(
        GROCERY_LIST_QUERY_KEYS.groceryLists,
        (old: GroceryListWithStats[] | undefined) => {
          if (!old) return old;
          return old.map((list) =>
            list.id === listId ? { ...list, is_completed: isCompleted } : list
          );
        }
      );

      return { previousListData, previousListsData, listId };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousListData) {
        queryClient.setQueryData(
          GROCERY_LIST_QUERY_KEYS.groceryList(context.listId),
          context.previousListData
        );
      }
      if (context?.previousListsData) {
        queryClient.setQueryData(
          GROCERY_LIST_QUERY_KEYS.groceryLists,
          context.previousListsData
        );
      }
    },
    onSettled: (data) => {
      // Refetch to ensure consistency
      if (data) {
        queryClient.invalidateQueries({
          queryKey: GROCERY_LIST_QUERY_KEYS.groceryList(data.id),
        });
      }
      queryClient.invalidateQueries({
        queryKey: GROCERY_LIST_QUERY_KEYS.groceryLists,
      });
    },
  });
};

// Hook to automatically manage completion status (with debouncing)
export const useAutoUpdateCompletion = (groceryList: GroceryListFull) => {
  const updateCompletionMutation = useUpdateGroceryListCompletion();

  useEffect(() => {
    const totalItems = groceryList.items.length;
    const checkedItems = groceryList.items.filter(
      (item) => item.is_checked
    ).length;

    // Only update if there are items to check
    if (totalItems === 0) return;

    const shouldBeCompleted = checkedItems === totalItems;

    // Only update if the status actually needs to change
    if (groceryList.is_completed !== shouldBeCompleted) {
      // Debounce the completion update to avoid rapid API calls
      const timeoutId = setTimeout(() => {
        updateCompletionMutation.mutate({
          listId: groceryList.id,
          isCompleted: shouldBeCompleted,
        });
      }, 300); // 300ms debounce

      return () => clearTimeout(timeoutId);
    }
  }, [
    groceryList.items,
    groceryList.is_completed,
    groceryList.id,
    updateCompletionMutation,
  ]);

  return {
    isUpdatingCompletion: updateCompletionMutation.isPending,
    updateCompletionError: updateCompletionMutation.error,
  };
};
