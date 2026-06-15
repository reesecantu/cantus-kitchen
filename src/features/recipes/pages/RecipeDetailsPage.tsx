import { useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { RecipeDetails } from "../components";
import { ROUTES } from "../../../utils/constants";
import type { RecipeWithIngredients, UnitDisplayInfo } from "../api";

interface RecipeDetailsPageProps {
  initialRecipe?: RecipeWithIngredients;
  units?: UnitDisplayInfo[];
}

export const RecipeDetailsPage = ({
  initialRecipe,
  units = [],
}: RecipeDetailsPageProps) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) {
      navigate(ROUTES.RECIPES);
    }
  }, [id, navigate]);

  if (!id) return null;

  return (
    <div className="mx-10 md:mx-20 lg:mx-40 my-10">
      <RecipeDetails recipeId={id} initialRecipe={initialRecipe} units={units} />
    </div>
  );
};
