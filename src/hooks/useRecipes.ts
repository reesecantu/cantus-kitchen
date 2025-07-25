import { useQuery } from '@tanstack/react-query';
import type { Tables } from '../types/database-types';
import { supabase } from '../../supabase/supabase-client';

export const useRecipes = () => {
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