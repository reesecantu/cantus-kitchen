import { useQuery } from "@tanstack/react-query";
import type { Tables } from "@/types/database-types";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/features/auth/AuthContext";
import { fetchRecipes } from "../api";

export const useRecipes = (initialData?: Tables<"recipes">[]) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["recipes", user?.id ?? null],
    queryFn: () => fetchRecipes(supabase, user?.id ?? null),
    initialData,
    staleTime: initialData ? 30_000 : 0,
  });
};
