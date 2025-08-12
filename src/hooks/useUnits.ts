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
        .order('type', { ascending: false })
        .order('system', { ascending: false })
        .order('name');
      
      if (error) throw error;
      
      const units = data || [];
      
      // Move the empty string unit to the front
      const emptyNameUnit = units.find(unit => unit.name === '');
      const otherUnits = units.filter(unit => unit.name !== '');
      
      return emptyNameUnit ? [emptyNameUnit, ...otherUnits] : units;
    },
  });
};