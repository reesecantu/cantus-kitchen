import { useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { RecipeDetails } from "../components/recipes";
import { ROUTES } from "../utils/constants";

export const RecipeDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) {
      navigate(ROUTES.RECIPES);
    }
  }, [id, navigate]);

  if (!id) return null;

  console.log("Recipe id used is ", id);

  return (
    <div className="mx-10 md:mx-20 lg:mx-40 my-10">
      <RecipeDetails recipeId={id} />
    </div>
  );
};
