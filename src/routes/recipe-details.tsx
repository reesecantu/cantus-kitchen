import { data } from "react-router";
import type { Route } from "./+types/recipe-details";
import { RecipeDetailsPage } from "@/features/recipes/pages/RecipeDetailsPage";
import { fetchRecipeDetails } from "@/features/recipes/api";
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
    const recipe = await fetchRecipeDetails(supabase, params.id);
    return data({ recipe }, { headers });
  } catch {
    throw data("Recipe not found", { status: 404, headers });
  }
}

export default function RecipeDetailsRoute({
  loaderData,
}: Route.ComponentProps) {
  return <RecipeDetailsPage initialRecipe={loaderData.recipe} />;
}
