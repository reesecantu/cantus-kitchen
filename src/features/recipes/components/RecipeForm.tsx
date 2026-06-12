import type { ReactNode } from "react";
import { useIngredients } from "@/features/recipes/hooks/useIngredients";
import { IngredientMultiSelect } from "./IngredientMultiSelect";
import { StepsInput } from "./StepsInput";
import { ImageUpload } from "@/components/ImageUpload";
import type { RecipeFormData } from "../types";

// Bounds mirror the DB CHECK constraints exactly:
// recipes_name_check (length(name) < 100) and
// recipes_servings_check (servings > 0 AND servings < 300).
const NAME_MAX = 99;
const SERVINGS_MAX = 299;

interface RecipeFormProps {
  formData: RecipeFormData;
  onChange: (data: RecipeFormData) => void;
  /** Called only after client validation passes. */
  onSubmit: () => void | Promise<void>;
  onCancel?: () => void;
  title: string;
  submitLabel: string;
  submittingLabel: string;
  isSubmitting: boolean;
  /** Bump to remount ImageUpload (e.g. after a reset/clear). */
  imageUploadKey?: number;
  /** Optional slot in the header, e.g. a "Clear Form" button. */
  headerAction?: ReactNode;
}

/**
 * Presentational recipe form shared by create and edit. State is lifted to the
 * container (controlled via formData/onChange) so each caller owns its own
 * concerns — create keeps a localStorage draft, edit seeds from a loaded
 * recipe — while the fields, layout and validation live here once.
 */
export const RecipeForm = ({
  formData,
  onChange,
  onSubmit,
  onCancel,
  title,
  submitLabel,
  submittingLabel,
  isSubmitting,
  imageUploadKey = 0,
  headerAction,
}: RecipeFormProps) => {
  const { data: ingredients = [], isLoading: ingredientsLoading } =
    useIngredients();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const missingFields: string[] = [];

    if (!formData.name.trim()) {
      missingFields.push("Recipe name");
    }
    if (formData.ingredients.length === 0) {
      missingFields.push("Ingredients");
    }
    if (formData.steps.length === 0) {
      missingFields.push("Steps");
    } else if (formData.steps.some((step) => !step.trim())) {
      missingFields.push("Complete all steps (some steps are empty)");
    }
    if (formData.servings < 1 || formData.servings > SERVINGS_MAX) {
      missingFields.push(`Valid servings (1-${SERVINGS_MAX})`);
    }
    const incompleteIngredients = formData.ingredients.filter(
      (ing) => !ing.unit_id
    );
    if (incompleteIngredients.length > 0) {
      missingFields.push(
        `Unit for ${incompleteIngredients.length} ingredient(s)`
      );
    }

    if (missingFields.length > 0) {
      alert(`Missing the following fields:\n\n• ${missingFields.join("\n• ")}`);
      return;
    }

    onSubmit();
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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        {headerAction}
      </div>

      <form
        onSubmit={handleSubmit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
          }
        }}
        className="space-y-6"
      >
        {/* Recipe Name */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              Recipe Name
            </label>
          </div>
          <div>
            <input
              type="text"
              id="name"
              maxLength={NAME_MAX}
              value={formData.name}
              onChange={(e) => onChange({ ...formData, name: e.target.value })}
              autoComplete="off"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter recipe name"
              required
            />
            <div className="text-right mr-1">
              <span className="text-xs text-gray-500">
                {formData.name.length}/{NAME_MAX}
              </span>
            </div>
          </div>
        </div>

        {/* Image Upload - Url or file */}
        <ImageUpload
          key={imageUploadKey}
          imageFile={formData.image_file}
          imageUrl={formData.image_url}
          onImageChange={(file) => onChange({ ...formData, image_file: file })}
          onImageUrlChange={(url) => onChange({ ...formData, image_url: url })}
        />

        {/* Servings Input */}
        <div>
          <label
            htmlFor="servings"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Servings
          </label>
          <input
            type="number"
            id="servings"
            min="1"
            max={SERVINGS_MAX}
            inputMode="numeric"
            value={formData.servings === 0 ? "" : formData.servings}
            onChange={(e) => {
              const value = e.target.value;
              if (value === "") {
                onChange({ ...formData, servings: 0 });
              } else {
                const numValue = parseInt(value);
                if (!isNaN(numValue)) {
                  onChange({
                    ...formData,
                    servings: Math.max(1, Math.min(SERVINGS_MAX, numValue)),
                  });
                }
              }
            }}
            onBlur={() => {
              if (formData.servings === 0) {
                onChange({ ...formData, servings: 1 });
              }
            }}
            className="w-20 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* Ingredients Multi-Select */}
        <IngredientMultiSelect
          ingredients={ingredients}
          selectedIngredients={formData.ingredients}
          onIngredientsChange={(ingredients) =>
            onChange({ ...formData, ingredients })
          }
        />

        {/* Steps Input */}
        <StepsInput
          steps={formData.steps}
          onStepsChange={(steps) => onChange({ ...formData, steps })}
        />

        {/* Submit / Cancel Buttons */}
        <div className="flex justify-end gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-6 py-2 bg-white text-gray-700 font-medium rounded-md border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? submittingLabel : submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
};
