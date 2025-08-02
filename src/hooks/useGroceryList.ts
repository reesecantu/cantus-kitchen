import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../supabase/supabase-client';
import type { GroceryListWithStats, GroceryListFull } from '../types/grocery-list';

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

type GroceryListItemWithRelations = {
  id: string;
  grocery_list_id: string | null;
  ingredient_id: number | null;
  quantity: number;
  unit_id: string | null;
  notes: string | null;
  is_checked: boolean | null;
  is_manual: boolean | null;
  source_recipes: string[] | null;
  created_at: string | null;
  updated_at: string | null;
  ingredients: {
    name: string;
    grocery_aisle_id: number | null;
    grocery_aisles: {
      name: string;
    } | null;
  } | null;
  units: {
    name: string;
    abbreviation: string;
  } | null;
};

type GroceryListItemForStats = {
  is_checked: boolean | null;
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
              grocery_aisles (name)
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
          ingredient_name: item.ingredients?.name || 'Unknown Ingredient',
          unit_name: item.units?.name || '',
          unit_abbreviation: item.units?.abbreviation || '',
          grocery_aisle_id: item.ingredients?.grocery_aisle_id || 0,
          grocery_aisle_name: item.ingredients?.grocery_aisles?.name || 'Other'
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

// Toggle grocery list item checked status
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
    onSuccess: (data) => {
      // Update cache optimistically
      queryClient.setQueryData(
        GROCERY_LIST_QUERY_KEYS.groceryList(data.grocery_list_id!),
        (old: GroceryListFull | undefined) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map(item =>
              item.id === data.id ? { ...item, is_checked: data.is_checked } : item
            )
          };
        }
      );
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
      notes?: string; 
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