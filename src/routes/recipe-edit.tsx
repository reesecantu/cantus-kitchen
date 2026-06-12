import { data } from "react-router";
import type { Route } from "./+types/recipe-edit";
import { EditRecipePage } from "@/features/recipes/pages/EditRecipePage";
import { fetchRecipeDetails } from "@/features/recipes/api";
import { getServerClient } from "@/lib/supabase.server";

export const meta: Route.MetaFunction = ({ data }) => {
  if (!data?.recipe) {
    return [{ title: "Edit Recipe | Cantu's Kitchen" }];
  }
  return [
    { title: `Edit ${data.recipe.name} | Cantu's Kitchen` },
    // Editing is owner-only; keep it out of search results.
    { name: "robots", content: "noindex" },
  ];
};

export async function loader({ request, params }: Route.LoaderArgs) {
  const { supabase, headers } = getServerClient(request);
  try {
    const recipe = await fetchRecipeDetails(supabase, params.id);
    return data({ recipe }, { headers });
  } catch (error) {
    // Mirror recipe-details: only a genuinely missing recipe is a 404.
    // PGRST116 = .single() found no rows; 22P02 = invalid uuid in the URL
    const code = (error as { code?: string })?.code;
    if (code === "PGRST116" || code === "22P02") {
      throw data("Recipe not found", { status: 404, headers });
    }
    throw data("Failed to load recipe", { status: 500, headers });
  }
}

export default function RecipeEditRoute({ loaderData }: Route.ComponentProps) {
  return <EditRecipePage recipe={loaderData.recipe} />;
}
