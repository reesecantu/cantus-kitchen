import { useQuery } from '@tanstack/react-query';
import type { Tables } from '../../types/database-types';
import { supabase } from '../../../supabase/supabase-client';

export const useRecipes = () => {
  return useQuery({
    queryKey: ['recipes'],
    queryFn: async (): Promise<Tables<'recipes'>[]> => {
      const { data, error } = await supabase.rpc("get_public_and_user_recipes").order("created_at", {ascending: false});
      
      if (error) {
        console.error('Error fetching recipes:', error);
        throw error;
      }
      
      return data || [];
    },
  });
};

export const usePublicRecipes = () => {
  return useQuery({
    queryKey: ['public_recipes'],
    queryFn: async (): Promise<Tables<'recipes'>[]> => {
      const { data, error } = await supabase.rpc("get_public_recipes").order("created_at", {ascending: false});

      if (error) {
        console.error('Error fetching public recipes: ', error);
        throw error;
      }

      return data || [];
    }
  })
}

export const useRecipesByUser = () => {
  return useQuery({
    queryKey: ['recipes'],
    queryFn: async (): Promise<Tables<'recipes'>[]> => {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .order('created_at', {ascending: false});
      
      if (error) {
        console.error('Error fetching recipes:', error);
        throw error;
      }
      
      return data || [];
    },
  });
};