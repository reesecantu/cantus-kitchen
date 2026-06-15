import { Link } from "react-router";
import { useRecipes, type SsrRecipes } from "../hooks/useRecipes";
import { RecipeTile } from "./RecipeTile";
import { ROUTES } from "@/utils/constants";

interface RecipeListProps {
  searchTerm: string;
  ssrRecipes?: SsrRecipes;
}

export const RecipeList = ({ searchTerm, ssrRecipes }: RecipeListProps) => {
  const { data: recipes = [], isLoading, error } = useRecipes(ssrRecipes);

  const filteredRecipes = recipes.filter((recipe) => {
    if (!searchTerm.trim()) return true;

    const searchLowerCase = searchTerm.toLowerCase();
    return recipe.name.toLowerCase().includes(searchLowerCase);
  });

  if (isLoading) {
    return (
      <div className="mx-20">
        <div className="flex justify-center items-center py-12">
          <div className="text-gray-500">Loading recipes...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-20">
        <div className="flex justify-center items-center py-12">
          <div className="text-red-500">
            Error loading recipes. Please try again.
          </div>
        </div>
      </div>
    );
  }

  if (recipes.length === 0) {
    return (
      <div className="mx-20">
        <div className="flex justify-center items-center py-12">
          <div className="text-gray-500">
            No recipes found. Create your first recipe!
          </div>
        </div>
      </div>
    );
  }

  if (filteredRecipes.length === 0) {
    return (
      <div className="mx-20">
        <div className="flex justify-center items-center py-12">
          <div className="text-gray-500">
            No recipes found for "{searchTerm}". Try searching for something
            else.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {filteredRecipes.map((recipe) => (
        <Link key={recipe.id} to={ROUTES.RECIPE_DETAILS(recipe.id)}>
          <RecipeTile recipe={recipe} />
        </Link>
      ))}
    </div>
  );
};
