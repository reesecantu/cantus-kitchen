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

/**
 * Parse one untrusted draft ingredient, or null if it can't be rendered/saved.
 * `ingredient_id` (number) and `ingredient_name` (string) are mandatory — the
 * server rejects a non-number id and the row can't render without a name — so a
 * malformed row from an older or corrupted draft is dropped rather than spread
 * blindly into form state (where it would later fail create with a generic 400).
 */
function parseDraftIngredient(raw: unknown): RecipeIngredient | null {
  if (!raw || typeof raw !== "object") return null;
  const ing = raw as Record<string, unknown>;
  if (typeof ing.ingredient_id !== "number") return null;
  if (typeof ing.ingredient_name !== "string" || !ing.ingredient_name) return null;
  return {
    rowId:
      typeof ing.rowId === "string" && ing.rowId
        ? ing.rowId
        : crypto.randomUUID(),
    groupId: typeof ing.groupId === "string" ? ing.groupId : undefined,
    ingredient_id: ing.ingredient_id,
    ingredient_name: ing.ingredient_name,
    unit_id: typeof ing.unit_id === "string" ? ing.unit_id : null,
    unit_name: typeof ing.unit_name === "string" ? ing.unit_name : "",
    unit_amount: typeof ing.unit_amount === "number" ? ing.unit_amount : undefined,
    note: typeof ing.note === "string" ? ing.note : "",
    group_label: typeof ing.group_label === "string" ? ing.group_label : null,
  };
}

/** Validate + normalize a draft's ingredient array, then (re)seed group ids. */
function parseDraftIngredients(raw: unknown): RecipeIngredient[] {
  if (!Array.isArray(raw)) return [];
  const rows = raw
    .map(parseDraftIngredient)
    .filter((r): r is RecipeIngredient => r !== null);
  if (rows.length !== raw.length) {
    console.warn(
      `Dropped ${raw.length - rows.length} malformed draft ingredient(s).`
    );
  }
  // seedGroupIds preserves a groupId already in the draft and rebuilds it from
  // contiguous label runs for older drafts that predate the field.
  return seedGroupIds(rows);
}

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
          ingredients: parseDraftIngredients(parsed.ingredients),
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
