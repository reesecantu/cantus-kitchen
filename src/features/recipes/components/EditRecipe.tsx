import { useState } from "react";
import { useNavigate } from "react-router";
import { useUpdateRecipe } from "../hooks/useRecipeMutations";
import { RecipeForm } from "./RecipeForm";
import { ROUTES } from "@/utils/constants";
import type { RecipeWithIngredients } from "../api";
import type { RecipeFormData } from "../types";

interface EditRecipeProps {
  recipe: RecipeWithIngredients;
}

function toFormData(recipe: RecipeWithIngredients): RecipeFormData {
  return {
    name: recipe.name,
    steps: recipe.steps ?? [],
    image_file: undefined,
    image_url: recipe.image_url ?? undefined,
    servings: recipe.servings,
    ingredients: recipe.ingredients.map((ing) => ({
      ingredient_id: ing.ingredient_id,
      ingredient_name: ing.ingredient_name,
      unit_id: ing.unit_id,
      unit_name: ing.unit_name,
      unit_amount: ing.unit_amount ?? undefined,
      note: ing.note ?? undefined,
    })),
  };
}

export const EditRecipe = ({ recipe }: EditRecipeProps) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<RecipeFormData>(() =>
    toFormData(recipe)
  );
  const updateRecipeMutation = useUpdateRecipe();

  const handleSubmit = async () => {
    try {
      await updateRecipeMutation.mutateAsync({
        recipeId: recipe.id,
        recipe: {
          name: formData.name.trim(),
          steps: formData.steps.filter((step) => step.trim()),
          servings: formData.servings,
        },
        ingredients: formData.ingredients.map((ing) => ({
          ingredient_id: ing.ingredient_id,
          unit_id: ing.unit_id || null,
          unit_amount:
            ing.unit_amount && ing.unit_amount > 0 ? ing.unit_amount : null,
          note: ing.note?.trim() || null,
        })),
        imageFile: formData.image_file,
        imageUrl: formData.image_url,
      });

      navigate(ROUTES.RECIPE_DETAILS(recipe.id));
    } catch (error) {
      console.error("Error updating recipe:", error);
      alert("Failed to update recipe. Please try again.");
    }
  };

  return (
    <RecipeForm
      formData={formData}
      onChange={setFormData}
      onSubmit={handleSubmit}
      onCancel={() => navigate(ROUTES.RECIPE_DETAILS(recipe.id))}
      title="Edit Recipe"
      submitLabel="Save Changes"
      submittingLabel="Saving..."
      isSubmitting={updateRecipeMutation.isPending}
    />
  );
};
