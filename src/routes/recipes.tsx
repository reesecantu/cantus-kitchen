import { data } from "react-router";
import type { Route } from "./+types/recipes";
import { RecipesPage } from "@/features/recipes/pages/RecipesPage";
import { fetchRecipes } from "@/features/recipes/api";
import { getServerClient } from "@/lib/supabase.server";

export const meta: Route.MetaFunction = () => [
  { title: "Recipes | Cantu's Kitchen" },
  {
    name: "description",
    content:
      "Browse recipes on Cantu's Kitchen. Add any recipe to an auto-organized grocery list with flexible serving sizes.",
  },
];

export async function loader({ request }: Route.LoaderArgs) {
  const { supabase, headers } = getServerClient(request);
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const recipes = await fetchRecipes(supabase, user?.id ?? null);
    return data({ recipes }, { headers });
  } catch {
    // Render the page shell; the client-side query will surface the error
    return data({ recipes: undefined }, { headers });
  }
}

export default function RecipesRoute({ loaderData }: Route.ComponentProps) {
  return <RecipesPage initialRecipes={loaderData.recipes} />;
}
