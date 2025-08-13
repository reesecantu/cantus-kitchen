import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../supabase/supabase-client';
import type { GroceryListWithStats, GroceryListFull } from '../types/grocery-list';
import type { Tables } from '../types/database-types';
import { useEffect } from 'react';

export const GROCERY_LIST_QUERY_KEYS = {
  groceryLists: ['grocery-lists'] as const,
  groceryList: (id: string) => ['grocery-list', id] as const,
  groceryListItems: (id: string) => ['grocery-list-items', id] as const,
};

// Types for the nested query responses
type GroceryListRecipeWithRecipe = {
  id: string;
  grocery_list_id: string | null;
  recipe_id: number | null;
  servings_multiplier: number | null;
  added_at: string | null;
  recipes: {
    name: string;
  } | null;
};

type GroceryListItemForStats = {
  is_checked: boolean | null;
};

type GroceryListItemWithRelations = Tables<'grocery_list_items'> & {
  ingredients: Tables<'ingredients'> & {
    grocery_aisles: Tables<'grocery_aisles'> | null;
  } | null;
  units: Tables<'units'> | null;
};

// Fetch all user's grocery lists
export const useGroceryLists = () => {
  return useQuery({
    queryKey: GROCERY_LIST_QUERY_KEYS.groceryLists,
    queryFn: async (): Promise<GroceryListWithStats[]> => {
      const { data, error } = await supabase
        .from('grocery_lists')
        .select(`
          *,
          grocery_list_recipes(*),
          grocery_list_items(is_checked)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching grocery lists:', error);
        throw error;
      }

      return (data || []).map(list => {
        const recipes = list.grocery_list_recipes || [];
        const items = list.grocery_list_items || [];
        const completedItems = items.filter((item: GroceryListItemForStats) => item.is_checked === true);
        
        return {
          ...list,
          recipe_count: recipes.length,
          item_count: items.length,
          completed_item_count: completedItems.length
        };
      });
    },
  });
};

// Fetch single grocery list with full details
export const useGroceryList = (listId: string) => {
  return useQuery({
    queryKey: GROCERY_LIST_QUERY_KEYS.groceryList(listId),
    queryFn: async (): Promise<GroceryListFull> => {
      const { data, error } = await supabase
        .from('grocery_lists')
        .select(`
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
        `)
        .eq('id', listId)
        .single();

      if (error) {
        console.error('Error fetching grocery list:', error);
        throw error;
      }

      return {
        ...data,
        recipes: (data.grocery_list_recipes || []).map((glr: GroceryListRecipeWithRecipe) => ({
          ...glr,
          recipe_name: glr.recipes?.name || 'Unknown Recipe'
        })),
        items: (data.grocery_list_items || []).map((item: GroceryListItemWithRelations) => ({
          ...item,
          ingredient_name: item.ingredients?.name || item.manual_name || "Unknown Ingredient",
          unit_name: item.units?.name || '',
          unit_abbreviation: item.units?.abbreviation || '',
          grocery_aisle_id: item.ingredients?.grocery_aisle_id || 0,
          grocery_aisle_name: item.ingredients?.grocery_aisles?.name || 'Other',
          grocery_aisle_display_order: item.ingredients?.grocery_aisles?.display_order || 999
        }))
      };
    },
    enabled: !!listId,
  });
};

// Create grocery list
export const useCreateGroceryList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, description }: { name: string; description?: string }) => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('grocery_lists')
        .insert([{
          name,
          description: description || null,
          user_id: userData.user.id
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GROCERY_LIST_QUERY_KEYS.groceryLists });
    },
  });
};

// Add recipe to grocery list
export const useAddRecipeToGroceryList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      listId, 
      recipeId, 
      servingsMultiplier = 1.0 
    }: { 
      listId: string; 
      recipeId: string; 
      servingsMultiplier?: number; 
    }) => {
      const { data, error } = await supabase.rpc('add_recipe_to_grocery_list', {
        list_id: listId,
        p_recipe_id: recipeId,
        servings_multiplier: servingsMultiplier
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: GROCERY_LIST_QUERY_KEYS.groceryList(variables.listId) 
      });
    },
  });
};

// Remove recipe from grocery list
export const useRemoveRecipeFromGroceryList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ listId, recipeId }: { listId: string; recipeId: string }) => {
      const { error } = await supabase
        .from('grocery_list_recipes')
        .delete()
        .eq('grocery_list_id', listId)
        .eq('recipe_id', recipeId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: GROCERY_LIST_QUERY_KEYS.groceryList(variables.listId) 
      });
    },
  });
};

// Toggle grocery list item checked status with optimistic updates
export const useToggleGroceryListItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, isChecked }: { itemId: string; isChecked: boolean }) => {
      const { data, error } = await supabase
        .from('grocery_list_items')
        .update({ is_checked: isChecked, updated_at: new Date().toISOString() })
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async ({ itemId, isChecked }) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ 
        queryKey: ['grocery-list'] 
      });

      // Snapshot the previous value for rollback
      const previousData = queryClient.getQueriesData({
        queryKey: ['grocery-list']
      });

      // Optimistically update all relevant grocery list queries
      queryClient.setQueriesData(
        { queryKey: ['grocery-list'] },
        (old: GroceryListFull | undefined) => {
          if (!old) return old;
          
          // Preserve original order by updating in place
          const updatedItems = old.items.map(item =>
            item.id === itemId ? { ...item, is_checked: isChecked } : item
          );

          // Also optimistically update completion status
          const totalItems = updatedItems.length;
          const checkedItems = updatedItems.filter(item => item.is_checked).length;
          const shouldBeCompleted = totalItems > 0 && checkedItems === totalItems;

          return {
            ...old,
            items: updatedItems, // This maintains the original order
            is_completed: shouldBeCompleted
          };
        }
      );

      // Return context for rollback
      return { previousData };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      // Always refetch after mutation (success or error) to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['grocery-list'] });
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
      notes 
    }: { 
      listId: string; 
      ingredientName: string; 
      quantity: number; 
      unitName: string; 
      notes?: string | null;
    }) => {
      const { data, error } = await supabase.rpc('add_manual_item_to_grocery_list', {
        list_id: listId,
        ingredient_name: ingredientName,
        quantity,
        unit_name: unitName,
        notes: notes || undefined
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: GROCERY_LIST_QUERY_KEYS.groceryList(variables.listId) 
      });
    },
  });
};

export const useUpdateGroceryList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      listId, 
      updates 
    }: { 
      listId: string; 
      updates: { name?: string; description?: string } 
    }) => {
      const { data, error } = await supabase
        .from('grocery_lists')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', listId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: GROCERY_LIST_QUERY_KEYS.groceryList(data.id) 
      });
      queryClient.invalidateQueries({ 
        queryKey: GROCERY_LIST_QUERY_KEYS.groceryLists 
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

// Remove grocery list item
export const useRemoveGroceryListItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('grocery_list_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      // Find which grocery list this item belonged to and invalidate its cache
      queryClient.invalidateQueries({ 
        queryKey: GROCERY_LIST_QUERY_KEYS.groceryLists 
      });
      
      // Also invalidate all grocery list detail queries since we don't know which list this item was from
      queryClient.invalidateQueries({ 
        queryKey: ['grocery-list'] 
      });
    },
    onError: (error) => {
      console.error("Error removing grocery list item", error);
    },
  });
};

// Update grocery list completion status with optimistic updates
export const useUpdateGroceryListCompletion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ listId, isCompleted }: { listId: string; isCompleted: boolean }) => {
      const { data, error } = await supabase
        .from('grocery_lists')
        .update({ 
          is_completed: isCompleted, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', listId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async ({ listId, isCompleted }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ 
        queryKey: GROCERY_LIST_QUERY_KEYS.groceryList(listId) 
      });
      await queryClient.cancelQueries({ 
        queryKey: GROCERY_LIST_QUERY_KEYS.groceryLists 
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
          return old.map(list =>
            list.id === listId ? { ...list, is_completed: isCompleted } : list
          );
        }
      );

      return { previousListData, previousListsData, listId };
    },
    onError: (err, variables, context) => {
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
          queryKey: GROCERY_LIST_QUERY_KEYS.groceryList(data.id) 
        });
      }
      queryClient.invalidateQueries({ 
        queryKey: GROCERY_LIST_QUERY_KEYS.groceryLists 
      });
    },
  });
};

// Hook to automatically manage completion status (with debouncing)
export const useAutoUpdateCompletion = (groceryList: GroceryListFull) => {
  const updateCompletionMutation = useUpdateGroceryListCompletion();

  useEffect(() => {
    const totalItems = groceryList.items.length;
    const checkedItems = groceryList.items.filter(item => item.is_checked).length;
    
    // Only update if there are items to check
    if (totalItems === 0) return;
    
    const shouldBeCompleted = checkedItems === totalItems;
    
    // Only update if the status actually needs to change
    if (groceryList.is_completed !== shouldBeCompleted) {
      // Debounce the completion update to avoid rapid API calls
      const timeoutId = setTimeout(() => {
        updateCompletionMutation.mutate({
          listId: groceryList.id,
          isCompleted: shouldBeCompleted
        });
      }, 300); // 300ms debounce

      return () => clearTimeout(timeoutId);
    }
  }, [
    groceryList.items, 
    groceryList.is_completed, 
    groceryList.id, 
    updateCompletionMutation
  ]);

  return {
    isUpdatingCompletion: updateCompletionMutation.isPending,
    updateCompletionError: updateCompletionMutation.error
  };
};



