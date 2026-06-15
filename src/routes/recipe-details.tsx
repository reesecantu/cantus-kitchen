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
  try {
    const [recipe, units] = await Promise.all([
      fetchRecipeDetails(supabase, params.id),
      fetchUnitsForDisplay(supabase),
    ]);
    return data({ recipe, units }, { headers });
  } catch (error) {
    // Only a genuinely missing recipe is a 404 — transient Supabase/network
    // failures must be 500s, or outages get recipe pages de-indexed.
    // PGRST116 = .single() found no rows; 22P02 = invalid uuid in the URL
    const code = (error as { code?: string })?.code;
    if (code === "PGRST116" || code === "22P02") {
      throw data("Recipe not found", { status: 404, headers });
    }
    throw data("Failed to load recipe", { status: 500, headers });
  }
}

export default function RecipeDetailsRoute({
  loaderData,
}: Route.ComponentProps) {
  return <RecipeDetailsPage initialRecipe={loaderData.recipe} units={loaderData.units} />;
}
