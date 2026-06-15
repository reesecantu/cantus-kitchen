import { data } from "react-router";
import type { Route } from "./+types/recipe-details";
import { RecipeDetailsPage } from "@/features/recipes/pages/RecipeDetailsPage";
import { fetchRecipeDetails, fetchUnitsForDisplay } from "@/features/recipes/api";
import { getServerClient } from "@/lib/supabase.server";

export const meta: Route.MetaFunction = ({ data }) => {
  if (!data?.recipe) {
    return [{ title: "Recipe | Cantu's Kitchen" }];
  }
  const { recipe } = data;
  const description = `${recipe.name} — full ingredient list and step-by-step instructions on Cantu's Kitchen. Add it to a grocery list in one click.`;
  return [
    { title: `${recipe.name} | Cantu's Kitchen` },
    { name: "description", content: description },
    { property: "og:title", content: recipe.name },
    { property: "og:description", content: description },
    { property: "og:type", content: "article" },
    ...(recipe.image_url
      ? [{ property: "og:image", content: recipe.image_url }]
      : []),
  ];
};

export async function loader({ request, params }: Route.LoaderArgs) {
  const { supabase, headers } = getServerClient(request);

  let recipe: Awaited<ReturnType<typeof fetchRecipeDetails>>;
  try {
    recipe = await fetchRecipeDetails(supabase, params.id);
  } catch (error) {
    // PGRST116 = .single() found no rows; 22P02 = invalid uuid in the URL
    const code = (error as { code?: string })?.code;
    if (code === "PGRST116" || code === "22P02") {
      throw data("Recipe not found", { status: 404, headers });
    }
    throw data("Failed to load recipe", { status: 500, headers });
  }

  // Units are optional display data — a failure here must not block the recipe page.
  let units: Awaited<ReturnType<typeof fetchUnitsForDisplay>> = [];
  try {
    units = await fetchUnitsForDisplay(supabase);
  } catch {
    // non-critical; render without unit conversion
  }

  return data({ recipe, units }, { headers });
}

export default function RecipeDetailsRoute({
  loaderData,
}: Route.ComponentProps) {
  return <RecipeDetailsPage initialRecipe={loaderData.recipe} units={loaderData.units} />;
}
