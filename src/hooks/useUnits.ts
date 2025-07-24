import { useQuery } from '@tanstack/react-query';
import type { Tables } from '../types/database-types';
import { supabase } from '../../supabase/supabase-client';

export const useUnits = () => {
  return useQuery({
    queryKey: ['units'],
    queryFn: async (): Promise<Tables<'units'>[]> => {
      const { data, error } = await supabase
        .from('units')
        .select('*')
        .order('display_order')
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
  });
};