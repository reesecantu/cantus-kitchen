import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GROCERY_LIST_QUERY_KEYS } from "./query-keys";
import type {
  GroceryListFull,
  GroceryListItemTransformed,
  GroceryListItemWithRelations,
  GroceryListRecipe,
} from "../types";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database-types";

type RecipeName =
  Database["public"]["Functions"]["get_grocery_list_recipe_names"]["Returns"][number];

// Fetch single grocery list with full details
export const useGroceryList = (listId: string) => {
  return useQuery({
    queryKey: GROCERY_LIST_QUERY_KEYS.groceryList(listId),
    queryFn: async (): Promise<GroceryListFull> => {
      // Recipe names come from a definer RPC: recipes RLS would hide another
      // member's private recipe from this user.
      const [{ data, error }, { data: recipeNames, error: namesError }] =
        await Promise.all([
          supabase
            .from("grocery_lists")
            .select(
              `
          *,
          grocery_list_recipes (*),
          grocery_list_items (
            *,
            ingredients (
              name,
              grocery_aisle_id,
              grocery_aisles (name, display_order),
              subaisle_positions (name, position)
            ),
            units (name, abbreviation)
          )
        `,
            )
            .eq("id", listId)
            .order("created_at", {
              referencedTable: "grocery_list_items",
              ascending: true,
            })
            .single(),
          supabase.rpc("get_grocery_list_recipe_names", { p_list_id: listId }),
        ]);

      const fetchError = error ?? namesError;
      if (fetchError) {
        console.error("Error fetching grocery list:", fetchError);
        throw fetchError;
      }

      const namesById = new Map<string | null, RecipeName>(
        (recipeNames ?? []).map((r: RecipeName) => [r.recipe_id, r]),
      );

      return {
        ...data,
        recipes: (data.grocery_list_recipes || []).map(
          (glr: GroceryListRecipe) => {
            const named = namesById.get(glr.recipe_id);
            return {
              ...glr,
              recipe_name: named?.name || "Unknown Recipe",
              recipe_visible: named?.recipe_visible ?? false,
            };
          },
        ),
        items: (data.grocery_list_items || [])
          .map(
            (
              item: GroceryListItemWithRelations,
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
              subaisle_position:
                item.ingredients?.subaisle_positions?.position || 999,
              subaisle_position_name:
                item.ingredients?.subaisle_positions?.name,
            }),
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
            },
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

// Members leave by deleting their own membership row (RLS self-delete; the
// user_id filter keeps it scoped even if delete policies widen). Never use
// useDeleteGroceryList for a member: RLS makes it a silent 0-row no-op.
export const useLeaveGroceryList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      listId,
      userId,
    }: {
      listId: string;
      userId: string;
    }) => {
      const { data, error } = await supabase
        .from("grocery_list_members")
        .delete()
        .eq("grocery_list_id", listId)
        .eq("user_id", userId)
        .select();

      if (error) throw new Error(error.message);
      // RLS turns a delete that matches nothing into a silent 0-row success.
      if (!data?.length) throw new Error("Membership not found");
    },
    // Blank (not remove) the cached list: Back then shows "not found" instead
    // of a list we lost access to, and a still-mounted page doesn't refetch.
    onSuccess: (_, { listId }) => {
      queryClient.setQueryData<GroceryListFull | null>(
        GROCERY_LIST_QUERY_KEYS.groceryList(listId),
        null,
      );
      queryClient.invalidateQueries({
        queryKey: GROCERY_LIST_QUERY_KEYS.groceryLists,
      });
    },
  });
};

// Owner only. share: true creates or regenerates the token, false stops sharing.
export const useSetGroceryListSharing = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      listId,
      share,
    }: {
      listId: string;
      share: boolean;
    }) => {
      const response = await fetch(`/api/grocery-lists/${listId}/share`, {
        method: share ? "POST" : "DELETE",
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload) {
        throw new Error(payload?.message ?? "Failed to update sharing");
      }
      return payload.shareToken as string | null;
    },
    // Stop an older in-flight refetch from landing after us with the old token.
    onMutate: ({ listId }) =>
      queryClient.cancelQueries({
        queryKey: GROCERY_LIST_QUERY_KEYS.groceryList(listId),
      }),
    // Write the returned token straight into the cache so the panel never
    // shows a dead link, even if a refetch would fail.
    onSuccess: (shareToken, { listId }) => {
      queryClient.setQueryData<GroceryListFull>(
        GROCERY_LIST_QUERY_KEYS.groceryList(listId),
        (old) => old && { ...old, share_token: shareToken },
      );
      queryClient.invalidateQueries({
        queryKey: GROCERY_LIST_QUERY_KEYS.groceryLists,
      });
    },
  });
};
