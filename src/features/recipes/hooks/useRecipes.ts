import { useQuery } from "@tanstack/react-query";
import type { Tables } from "@/types/database-types";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/features/auth/AuthContext";
import { fetchRecipes } from "../api";

/** SSR loader payload: recipes plus the user they were fetched for. */
export interface SsrRecipes {
  recipes: Tables<"recipes">[];
  userId: string | null;
}

export const useRecipes = (ssr?: SsrRecipes) => {
  const { user } = useAuth();
  const currentUserId = user?.id ?? null;

  // Only seed the cache when the loader data was fetched for the SAME user —
  // after a sign-in/sign-out the query key flips and seeding the old
  // snapshot would show the previous auth state's recipes as fresh
  const initialData =
    ssr && ssr.userId === currentUserId ? ssr.recipes : undefined;

  return useQuery({
    queryKey: ["recipes", currentUserId],
    queryFn: () => fetchRecipes(supabase, currentUserId),
    initialData,
    staleTime: initialData ? 30_000 : 0,
  });
};
