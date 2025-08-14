import { useState } from "react";
import { Plus, X } from "lucide-react";
import { useRecipes } from "../../hooks/recipes";
import {
  useAddRecipeToGroceryList,
  useRemoveRecipeFromGroceryList,
} from "../../hooks/grocery-lists";
import type { GroceryListFull } from "../../types/grocery-list";

interface GroceryListRecipesProps {
  groceryList: GroceryListFull;
}

export const GroceryListRecipes = ({
  groceryList,
}: GroceryListRecipesProps) => {
  const { data: allRecipes = [] } = useRecipes();
  const addRecipeMutation = useAddRecipeToGroceryList();
  const removeRecipeMutation = useRemoveRecipeFromGroceryList();

  const [showAddRecipe, setShowAddRecipe] = useState(false);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>("");
  const [servingsMultiplier, setServingsMultiplier] = useState(1);

  const handleAddRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecipeId) return;

    try {
      await addRecipeMutation.mutateAsync({
        listId: groceryList.id,
        recipeId: selectedRecipeId,
        servingsMultiplier,
      });
      setSelectedRecipeId("");
      setServingsMultiplier(1);
      setShowAddRecipe(false);
    } catch (error) {
      console.error("Failed to add recipe:", error);
    }
  };

  const handleRemoveRecipe = async (recipeId: string) => {
    try {
      await removeRecipeMutation.mutateAsync({
        listId: groceryList.id,
        recipeId: recipeId,
      });
    } catch (error) {
      console.error("Failed to remove recipe:", error);
    }
  };

  // Filter out recipes that are already in the grocery list
  const availableRecipes = allRecipes.filter(
    (recipe) => !groceryList.recipes.some((glr) => glr.recipe_id === recipe.id)
  );

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Recipes ({groceryList.recipes.length})
        </h2>
        <button
          onClick={() => setShowAddRecipe(!showAddRecipe)}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white hover:text-gray-100 px-2 py-1 rounded transition-colors font-medium shadow-md"
        >
          <Plus className="h-4 w-4 stroke-3" />
          Add Recipe
        </button>
      </div>

      {/* Add Recipe Form */}
      {showAddRecipe && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-md font-medium mb-3">Add Recipe to List</h3>
          <form onSubmit={handleAddRecipe} className="flex gap-2 flex-wrap">
            <select
              value={selectedRecipeId}
              onChange={(e) => setSelectedRecipeId(e.target.value)}
              className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-md"
              required
            >
              <option value="">Select a recipe...</option>
              {availableRecipes.map((recipe) => (
                <option key={recipe.id} value={recipe.id}>
                  {recipe.name}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Servings:</label>
              <input
                type="number"
                step="1"
                min="1"
                value={servingsMultiplier}
                onChange={(e) =>
                  setServingsMultiplier(parseFloat(e.target.value) || 1)
                }
                className="w-20 px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <button
              type="submit"
              disabled={addRecipeMutation.isPending}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {addRecipeMutation.isPending ? "Adding..." : "Add"}
            </button>
          </form>
        </div>
      )}

      {/* Recipe List */}
      {groceryList.recipes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {groceryList.recipes.map((recipe) => (
            <div
              key={recipe.recipe_id}
              className="relative p-3 bg-white rounded-lg group border border-gray-800"
            >
              <button
                onClick={() => handleRemoveRecipe(recipe.recipe_id!)}
                disabled={removeRecipeMutation.isPending}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
                title="Remove recipe"
              >
                <X className="h-3 w-3" />
              </button>
              <div className="font-semibold text-gray-800 pr-6">
                {recipe.recipe_name}
              </div>
              <div className="text-sm font-medium text-blue-500">
                Servings: {recipe.servings_multiplier}x
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
          No recipes added yet. Add a recipe to automatically generate shopping
          list items.
        </div>
      )}
    </div>
  );
};
