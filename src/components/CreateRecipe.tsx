import { useState } from "react";
import { useIngredients } from "../hooks/useIngredients";
import { useCreateRecipe } from "../hooks/useRecipeMutations";
import { IngredientMultiSelect } from "./IngredientMultiSelect";
import { StepsInput } from "./StepsInput";
import { ImageUpload } from "./ImageUpload";
import type { RecipeFormData } from "../types/recipe-form";

export const CreateRecipe = () => {
  const [formData, setFormData] = useState<RecipeFormData>({
    name: "",
    steps: [],
    image_file: undefined,
    ingredients: [],
  });

  const { data: ingredients = [], isLoading: ingredientsLoading } =
    useIngredients();
  const createRecipeMutation = useCreateRecipe();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || formData.steps.length === 0) {
      alert("Please fill in recipe name and at least one step");
      return;
    }

    // Check if any steps are empty
    const hasEmptySteps = formData.steps.some((step) => !step.trim());
    if (hasEmptySteps) {
      alert("Please fill in all steps or remove empty ones");
      return;
    }

    try {
      await createRecipeMutation.mutateAsync({
        recipe: {
          name: formData.name.trim(),
          steps: formData.steps.filter((step) => step.trim()),
        },
        ingredients: formData.ingredients.map((ing) => ({
          ingredient_id: ing.ingredient_id,
          unit_id: ing.unit_id || null,
          unit_amount:
            ing.unit_amount && ing.unit_amount > 0 ? ing.unit_amount : null, // Changed this line
          note: ing.note?.trim() || null,
        })),
        imageFile: formData.image_file, // Pass the file separately
      });

      // Reset form on success
      setFormData({
        name: "",
        steps: [],
        image_file: undefined,
        ingredients: [],
      });

      alert("Recipe created successfully!");
    } catch (error) {
      console.error("Error creating recipe:", error);
      alert("Failed to create recipe. Please try again.");
    }
  };

  if (ingredientsLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-gray-500">Loading ingredients...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md my-10">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Create New Recipe
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Recipe Name */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Recipe Name
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter recipe name"
            required
          />
        </div>

        {/* Image Upload - Replaced URL input */}
        <ImageUpload
          imageFile={formData.image_file}
          onImageChange={(file) =>
            setFormData({ ...formData, image_file: file })
          }
        />

        {/* Ingredients Multi-Select */}
        <IngredientMultiSelect
          ingredients={ingredients}
          selectedIngredients={formData.ingredients}
          onIngredientsChange={(ingredients) =>
            setFormData({ ...formData, ingredients })
          }
        />

        {/* Steps Input */}
        <StepsInput
          steps={formData.steps}
          onStepsChange={(steps) => setFormData({ ...formData, steps })}
        />

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={createRecipeMutation.isPending}
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createRecipeMutation.isPending ? "Creating..." : "Create Recipe"}
          </button>
        </div>
      </form>
    </div>
  );
};
