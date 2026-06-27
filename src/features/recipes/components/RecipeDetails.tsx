import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Clock,
  Users,
  Image as ImageIcon,
  Pencil,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useRecipeDetails } from "../hooks";
import { useDeleteRecipe } from "../hooks/useRecipeMutations";
import { useAuth } from "@/features/auth/AuthContext";
import { ROUTES } from "../../../utils/constants";
import { DeleteButton } from "@/components/DeleteButton";
import type { RecipeIngredientWithDetails, RecipeWithIngredients, UnitDisplayInfo } from "../api";
import {
  findBestUnitForQuantity,
  roundQuantity,
} from "@/server/grocery-aggregation";
import { groupContiguous, labelOf } from "@/features/recipes/ingredient-groups";

interface RecipeDetailsProps {
  recipeId: string;
  initialRecipe?: RecipeWithIngredients;
  units?: UnitDisplayInfo[];
}

const BackButton = () => {
  return (
    <Link
      to={ROUTES.RECIPES}
      className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors cursor-pointer w-fit"
    >
      <ArrowLeft className="h-4 w-4" /> Back to Recipes
    </Link>
  );
};

function scaleIngredients(
  ingredients: RecipeIngredientWithDetails[],
  scaleFactor: number,
  unitsById: Map<string, UnitDisplayInfo>,
  allUnits: UnitDisplayInfo[]
): RecipeIngredientWithDetails[] {
  return ingredients.map((ing) => {
    if (ing.unit_amount === null) return ing;

    const scaledAmount = ing.unit_amount * scaleFactor;
    const unit = ing.unit_id ? unitsById.get(ing.unit_id) : undefined;

    if (!unit || unit.baseConversionFactor === null) {
      return { ...ing, unit_amount: roundQuantity(scaledAmount) };
    }

    const baseQuantity = scaledAmount * unit.baseConversionFactor;
    const bestUnitId = findBestUnitForQuantity(
      baseQuantity,
      unit.type,
      allUnits
    );
    const bestUnit = bestUnitId ? unitsById.get(bestUnitId) : unit;
    const displayQuantity = bestUnit?.baseConversionFactor
      ? roundQuantity(baseQuantity / bestUnit.baseConversionFactor)
      : roundQuantity(scaledAmount);

    return {
      ...ing,
      unit_amount: displayQuantity,
      unit_id: bestUnitId ?? ing.unit_id,
      unit_name: bestUnit?.name ?? ing.unit_name,
      unit_abbreviation: bestUnit?.abbreviation ?? ing.unit_abbreviation,
    };
  });
}

export const RecipeDetails = ({
  recipeId,
  initialRecipe,
  units = [],
}: RecipeDetailsProps) => {
  const {
    data: recipe,
    isLoading,
    error,
  } = useRecipeDetails(recipeId, initialRecipe);
  const { user } = useAuth();
  const navigate = useNavigate();
  const deleteRecipe = useDeleteRecipe();
  const [searchParams] = useSearchParams();
  const [displayServings, setDisplayServings] = useState<number | null>(() => {
    const s = searchParams.get("servings");
    const n = s ? parseInt(s, 10) : NaN;
    return !isNaN(n) && n >= 1 ? Math.min(50, n) : null;
  });

  const [unitsById, allUnits] = useMemo(() => {
    const byId = new Map(units.map((u) => [u.id, u]));
    return [byId, Array.from(byId.values())];
  }, [units]);

  const effectiveServings = displayServings ?? recipe?.servings ?? 1;
  const isScaled =
    recipe !== undefined &&
    displayServings !== null &&
    displayServings !== recipe.servings;

  const displayIngredients = useMemo(() => {
    if (!recipe) return [];
    if (!isScaled) return recipe.ingredients;
    return scaleIngredients(
      recipe.ingredients,
      effectiveServings / recipe.servings,
      unitsById,
      allUnits
    );
  }, [recipe, isScaled, effectiveServings, unitsById, allUnits]);

  // Group ingredients into contiguous runs of equal group_label (the source of
  // truth is their stored order). Ungrouped rows ("") render without a header.
  const ingredientSections = useMemo(
    () =>
      groupContiguous(displayIngredients, labelOf).map((rows) => ({
        label: labelOf(rows[0]),
        rows,
      })),
    [displayIngredients]
  );

  const handleServingsChange = (delta: number) => {
    if (!recipe) return;
    const current = displayServings ?? recipe.servings;
    const next = Math.min(50, Math.max(1, current + delta));
    setDisplayServings(next === recipe.servings ? null : next);
  };

  const isOwner = !!user && recipe?.created_by === user.id;

  const handleDelete = async () => {
    try {
      await deleteRecipe.mutateAsync(recipeId);
      navigate(ROUTES.RECIPES);
    } catch (err) {
      console.error("Error deleting recipe:", err);
      alert("Failed to delete recipe. Please try again.");
    }
  };

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
        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            {recipe.name}
          </h1>

          {isOwner && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link
                to={ROUTES.RECIPE_EDIT(recipeId)}
                aria-label="Edit recipe"
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                <Pencil className="h-4 w-4" /> Edit
              </Link>
              <DeleteButton
                onDelete={handleDelete}
                isPending={deleteRecipe.isPending}
                confirmMessage="Delete this recipe? This can't be undone and will remove it from any grocery lists."
                ariaLabel="Delete recipe"
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-6 text-gray-600">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <div className="flex items-center">
              <span className="min-w-24 tabular-nums">
                {effectiveServings} servings
              </span>
              <div className="flex flex-col">
                <button
                  onClick={() => handleServingsChange(1)}
                  disabled={effectiveServings >= 50}
                  className="flex items-center justify-center rounded text-gray-500 hover:text-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Increase servings"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleServingsChange(-1)}
                  disabled={effectiveServings <= 1}
                  className="flex items-center justify-center rounded text-gray-500 hover:text-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Decrease servings"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            </div>
            {isScaled && (
              <button
                onClick={() => setDisplayServings(null)}
                className="text-sm text-blue-600 hover:underline"
              >
                Reset
              </button>
            )}
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
            {displayIngredients.length > 0 ? (
              <div className="space-y-5">
                {ingredientSections.map((section, sectionIndex) => (
                  <div key={`${sectionIndex}:${section.label}`} className="space-y-2">
                    {section.label && (
                      <h3 className="text-base font-semibold text-gray-800">
                        {section.label}
                      </h3>
                    )}
                    {section.rows.map((ingredient) => (
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
