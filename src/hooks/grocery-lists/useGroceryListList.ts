import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../../supabase/supabase-client";
import type { GroceryListItemForStats, GroceryListWithStats } from "../../types/grocery-list";
import { GROCERY_LIST_QUERY_KEYS } from "./query-keys";

// Fetch all user's grocery lists
export const useGroceryListList = () => {
  return useQuery({
    queryKey: GROCERY_LIST_QUERY_KEYS.groceryLists,
    queryFn: async (): Promise<GroceryListWithStats[]> => {
      const { data, error } = await supabase
        .from("grocery_lists")
        .select(
          `
          *,
          grocery_list_recipes(*),
          grocery_list_items(is_checked)
        `
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching grocery lists:", error);
        throw error;
      }

      return (data || []).map((list) => {
        const recipes = list.grocery_list_recipes || [];
        const items = list.grocery_list_items || [];
        const completedItems = items.filter(
          (item: GroceryListItemForStats) => item.is_checked === true
        );

        return {
          ...list,
          recipe_count: recipes.length,
          item_count: items.length,
          completed_item_count: completedItems.length,
        };
      });
    },
  });
};

// Create grocery list
export const useCreateGroceryList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      description,
    }: {
      name: string;
      description?: string;
    }) => {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (userError || !userData.user)
        throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("grocery_lists")
        .insert([
          {
            name,
            description: description || null,
            user_id: userData.user.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: GROCERY_LIST_QUERY_KEYS.groceryLists,
      });
    },
  });
};
