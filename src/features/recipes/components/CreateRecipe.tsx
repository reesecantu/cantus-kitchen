import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useCreateRecipe } from "../hooks/useRecipeMutations";
import { RecipeForm } from "./RecipeForm";
import { ROUTES } from "@/utils/constants";
import type { RecipeFormData, RecipeIngredient } from "../types";
import { seedGroupIds } from "../ingredient-groups";

const FORM_STORAGE_KEY = "createRecipeFormData";

const EMPTY_FORM: RecipeFormData = {
  name: "",
  steps: [],
  image_file: undefined,
  image_url: undefined,
  ingredients: [],
  servings: 1,
};

export const CreateRecipe = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<RecipeFormData>(EMPTY_FORM);

  // Restore any saved draft after mount — localStorage isn't available during
  // SSR, and reading it in the useState initializer would break hydration
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(FORM_STORAGE_KEY);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        // Validate the parsed data has required structure
        setFormData({
          name: parsed.name || "",
          steps: Array.isArray(parsed.steps) ? parsed.steps : [],
          image_file: undefined, // Files can't be persisted
          image_url: parsed.image_url || undefined,
          // seedGroupIds preserves a groupId already in the draft and rebuilds it
          // from contiguous label runs for older drafts that predate the field.
          ingredients: Array.isArray(parsed.ingredients)
            ? seedGroupIds(
                parsed.ingredients.map(
                  (ing: Record<string, unknown>): RecipeIngredient => ({
                    ...(ing as unknown as RecipeIngredient),
                    // Back-compat: older drafts predate rowId. Generate one (this
                    // runs in an effect, so crypto is available client-side).
                    rowId:
                      typeof ing.rowId === "string" && ing.rowId
                        ? ing.rowId
                        : crypto.randomUUID(),
                    group_label:
                      (ing.group_label as string | null | undefined) ?? null,
                  })
                )
              )
            : [],
          servings: parsed.servings || 1,
        });
      }
    } catch (error) {
      console.warn("Failed to parse saved form data:", error);
    }
  }, []);

  const [formKey, setFormKey] = useState(0);

  const createRecipeMutation = useCreateRecipe();

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    try {
      // Only save if there's meaningful data to persist
      if (
        formData.name ||
        formData.steps.length > 0 ||
        formData.ingredients.length > 0 ||
        formData.image_url ||
        formData.image_file
      ) {
        const dataToSave = {
          name: formData.name,
          steps: formData.steps,
          image_file: formData.image_file,
          image_url: formData.image_url,
          ingredients: formData.ingredients,
          servings: formData.servings,
        };
        localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(dataToSave));
      }
    } catch (error) {
      console.warn("Failed to save form data:", error);
    }
  }, [formData]);

  const clearSavedData = () => {
    localStorage.removeItem(FORM_STORAGE_KEY);
  };

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    clearSavedData();
    setFormKey((prev) => prev + 1);
  };

  const handleSubmit = async () => {
    try {
      const recipe = await createRecipeMutation.mutateAsync({
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
          group_label: ing.group_label ?? null,
        })),
        imageFile: formData.image_file,
        imageUrl: formData.image_url,
      });
      alert("Recipe created successfully!");
      resetForm();
      navigate(ROUTES.RECIPE_DETAILS(recipe.id));

    } catch (error) {
      console.error("Error creating recipe:", error);
      alert("Failed to create recipe. Please try again.");
    }
  };

  const handleClearForm = () => {
    if (confirm("Are you sure you want to clear all form data?")) {
      resetForm();
    }
  };

  const hasContent =
    !!formData.name ||
    formData.steps.length > 0 ||
    formData.ingredients.length > 0;

  return (
    <RecipeForm
      formData={formData}
      onChange={setFormData}
      onSubmit={handleSubmit}
      title="Create New Recipe"
      submitLabel="Create Recipe"
      submittingLabel="Creating..."
      isSubmitting={createRecipeMutation.isPending}
      imageUploadKey={formKey}
      headerAction={
        hasContent ? (
          <button
            type="button"
            onClick={handleClearForm}
            className="text-sm text-gray-500 hover:text-red-600 transition-colors"
          >
            Clear Form
          </button>
        ) : undefined
      }
    />
  );
};
