import { useQuery } from "@tanstack/react-query";
import type { Tables } from "@/types/database-types";
import { supabase } from "@/lib/supabase";
import { fetchRecipes } from "../api";

export const useRecipes = (initialData?: Tables<"recipes">[]) => {
  return useQuery({
    queryKey: ["recipes"],
    queryFn: () => fetchRecipes(supabase),
    initialData,
    staleTime: initialData ? 30_000 : 0,
  });
};

export const usePublicRecipes = () => {
  return useQuery({
    queryKey: ["public_recipes"],
    queryFn: async (): Promise<Tables<"recipes">[]> => {
      const { data, error } = await supabase
        .rpc("get_public_recipes")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching public recipes: ", error);
        throw error;
      }

      return data || [];
    },
  });
};
