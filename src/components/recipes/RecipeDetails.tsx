import { ArrowLeft, Clock, Users, Image as ImageIcon } from "lucide-react";
import { Link } from "react-router";
import { useRecipeDetails } from "../../hooks/useRecipeDetails";

interface RecipeDetailsProps {
  recipeId: string;
}

const BackButton = () => {
  return (
    <Link
      to={"/recipes"}
      className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors cursor-pointer w-fit"
    >
      <ArrowLeft className="h-4 w-4" /> Back to Recipes
    </Link>
  );
};

export const RecipeDetails = ({ recipeId }: RecipeDetailsProps) => {
  const { data: recipe, isLoading, error } = useRecipeDetails(recipeId);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-500">Loading recipe...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center py-12">
        <div className="text-red-500 mb-4">Error loading recipe</div>
        <BackButton />
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="flex flex-col items-center py-12">
        <div className="text-gray-500 mb-4">Recipe not found</div>
        <BackButton />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Back Button */}
      <BackButton />

      {/* Recipe Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          {recipe.name}
        </h1>

        <div className="flex items-center gap-6 text-gray-600">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <span>{recipe.servings} servings</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            <span>
              Created {new Date(recipe.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        {/* Recipe Content */}

        {/* Mobile Recipe Image */}
        <div className="block lg:hidden max-w-2xl aspect-[3/2]">
          <div className="w-full bg-gray-200 rounded-lg overflow-hidden">
            {recipe.image_url ? (
              <img
                src={recipe.image_url}
                alt={recipe.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                <ImageIcon className="w-16 h-16 mb-2" />
                <span>No Image</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8">
          {/* Ingredients */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Ingredients
            </h2>
            {recipe.ingredients.length > 0 ? (
              <div className="space-y-2">
                {recipe.ingredients.map((ingredient) => (
                  <div
                    key={ingredient.id}
                    className="flex items-start gap-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1 bg-white py-1 px-3 border rounded-lg border-gray-200">
                      <div className="flex items-center gap-2 flex-wrap">
                        {ingredient.unit_amount && (
                          <span className="font-medium text-gray-900">
                            {ingredient.unit_amount}
                          </span>
                        )}
                        {ingredient.unit_name && (
                          <span className="text-gray-900">
                            {ingredient.unit_abbreviation ||
                              ingredient.unit_name}
                          </span>
                        )}
                        <span className="font-medium text-gray-900">
                          {ingredient.ingredient_name}
                        </span>
                      </div>
                      {ingredient.note && (
                        <div className="text-sm text-gray-600 mt-1 italic">
                          {ingredient.note}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 italic">No ingredients listed</div>
            )}
          </div>
        </div>

        {/* Desktop Recipe Image */}
        <div className="hidden lg:block aspect-[3/2]">
          <div className="w-full bg-gray-200 rounded-lg overflow-hidden">
            {recipe.image_url ? (
              <img
                src={recipe.image_url}
                alt={recipe.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                <ImageIcon className="w-16 h-16 mb-2" />
                <span>No Image</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="my-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Instructions
        </h2>
        {recipe.steps && recipe.steps.length > 0 ? (
          <div className="space-y-4">
            {recipe.steps.map((step, index) => (
              <div
                key={index}
                className="flex gap-4 p-4 bg-white border border-gray-200 rounded-lg"
              >
                <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                  {index + 1}
                </div>
                <div className="flex-1 text-gray-700 leading-relaxed">
                  {step}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 italic">No instructions provided</div>
        )}
      </div>
    </div>
  );
};
