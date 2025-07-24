import { useQuery } from '@tanstack/react-query';
import type { Tables } from '../types/database-types';
import { supabase } from '../../supabase/supabase-client';

export const useIngredients = () => {
  return useQuery({
    queryKey: ['ingredients'],
    queryFn: async (): Promise<Tables<'ingredients'>[]> => {
      const { data, error } = await supabase
        .from('ingredients')
        .select('*')
        .order('name', {ascending: true});
      
      if (error) {
        console.error('Error fetching ingredients:', error);
        throw error;
      }
      
      return data || [];
    },
  });
};