import { Navigate } from "react-router";
import { useAuth } from "@/features/auth/AuthContext";
import { EditRecipe } from "../components/EditRecipe";
import { ROUTES } from "@/utils/constants";
import type { RecipeWithIngredients } from "../api";

interface EditRecipePageProps {
  recipe: RecipeWithIngredients;
}

export const EditRecipePage = ({ recipe }: EditRecipePageProps) => {
  const { user } = useAuth();

  if (!user) {
    return (
      <p className="pt-25 text-center text-lg text-gray-900">
        Sign in to edit your recipes!
      </p>
    );
  }

  // UX guard only — RLS (and the replace_recipe RPC) is the real enforcement.
  if (recipe.created_by !== user.id) {
    return <Navigate to={ROUTES.RECIPE_DETAILS(recipe.id)} replace />;
  }

  return (
    <div className="mx-4 md:mx-20 lg:mx-40">
      <EditRecipe recipe={recipe} />
    </div>
  );
};
