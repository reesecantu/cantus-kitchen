import { useState, useEffect } from "react";
import { useIngredients } from "../../hooks/useIngredients";
import { useCreateRecipe } from "../../hooks/recipes";
import { IngredientMultiSelect } from "../form-inputs/IngredientMultiSelect";
import { StepsInput } from "../form-inputs/StepsInput";
import { ImageUpload } from "../form-inputs/ImageUpload";
import type { RecipeFormData } from "../../types/recipe-form";

const FORM_STORAGE_KEY = "createRecipeFormData";

export const CreateRecipe = () => {
  // Initialize form data from localStorage or defaults
  const [formData, setFormData] = useState<RecipeFormData>(() => {
    try {
      const savedData = localStorage.getItem(FORM_STORAGE_KEY);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        // Validate the parsed data has required structure
        return {
          name: parsed.name || "",
          steps: Array.isArray(parsed.steps) ? parsed.steps : [],
          image_file: undefined, // Files can't be persisted
          image_url: parsed.image_url || undefined,
          ingredients: Array.isArray(parsed.ingredients)
            ? parsed.ingredients
            : [],
          servings: parsed.servings || 1,
        };
      }
    } catch (error) {
      console.warn("Failed to parse saved form data:", error);
    }

    // Return defaults if no saved data or parsing failed
    return {
      name: "",
      steps: [],
      image_file: undefined,
      image_url: undefined,
      ingredients: [],
      servings: 1,
    };
  });

  const [formKey, setFormKey] = useState(0);

  const { data: ingredients = [], isLoading: ingredientsLoading } =
    useIngredients();
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

  // Clear saved data helper
  const clearSavedData = () => {
    localStorage.removeItem(FORM_STORAGE_KEY);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Collect all missing fields
    const missingFields: string[] = [];

    // Check recipe name
    if (!formData.name.trim()) {
      missingFields.push("Recipe name");
    }

    // Check ingredients
    if (formData.ingredients.length === 0) {
      missingFields.push("Ingredients");
    }

    // Check steps
    if (formData.steps.length === 0) {
      missingFields.push("Steps");
    } else {
      // Check if any steps are empty
      const hasEmptySteps = formData.steps.some((step) => !step.trim());
      if (hasEmptySteps) {
        missingFields.push("Complete all steps (some steps are empty)");
      }
    }

    // Check servings (though this should be auto-handled by the input)
    if (formData.servings < 1 || formData.servings > 300) {
      missingFields.push("Valid servings (1-300)");
    }

    // Check for incomplete ingredients (optional but helpful)
    const incompleteIngredients = formData.ingredients.filter(
      (ing) => !ing.unit_id
    );
    if (incompleteIngredients.length > 0) {
      missingFields.push(
        `Unit for ${incompleteIngredients.length} ingredient(s)`
      );
    }

    // If there are missing fields, show detailed alert
    if (missingFields.length > 0) {
      const message = `Missing the following fields:\n\n• ${missingFields.join(
        "\n• "
      )}`;
      alert(message);
      return;
    }

    try {
      await createRecipeMutation.mutateAsync({
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

      // Reset form on success
      const resetData = {
        name: "",
        steps: [],
        image_file: undefined,
        image_url: undefined,
        ingredients: [],
        servings: 1,
      };

      setFormData(resetData);
      clearSavedData();
      setFormKey((prev) => prev + 1);

      alert("Recipe created successfully!");
    } catch (error) {
      console.error("Error creating recipe:", error);
      alert("Failed to create recipe. Please try again.");
    }
  };

  const handleClearForm = () => {
    if (confirm("Are you sure you want to clear all form data?")) {
      const resetData = {
        name: "",
        steps: [],
        image_file: undefined,
        image_url: undefined,
        ingredients: [],
        servings: 1,
      };
      setFormData(resetData);
      clearSavedData();
      setFormKey((prev) => prev + 1);
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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Create New Recipe</h2>

        {/* Optional: Show clear button if there's saved data */}
        {(formData.name ||
          formData.steps.length > 0 ||
          formData.ingredients.length > 0) && (
          <button
            type="button"
            onClick={handleClearForm}
            className="text-sm text-gray-500 hover:text-red-600 transition-colors"
          >
            Clear Form
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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
              maxLength={100}
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              autoComplete="off"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter recipe name"
              required
            />
            <div className="text-right mr-1">
              <span className="text-xs text-gray-500">
                {formData.name.length}/100
              </span>
            </div>
          </div>
        </div>

        {/* Image Upload - Url or file */}
        <ImageUpload
          key={formKey}
          imageFile={formData.image_file}
          imageUrl={formData.image_url}
          onImageChange={(file) =>
            setFormData({ ...formData, image_file: file })
          }
          onImageUrlChange={(url) =>
            setFormData({ ...formData, image_url: url })
          }
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
            max="300"
            inputMode="numeric"
            value={formData.servings === 0 ? "" : formData.servings}
            onChange={(e) => {
              const value = e.target.value;
              if (value === "") {
                // Allow empty field temporarily
                setFormData({
                  ...formData,
                  servings: 0, // Use 0 to represent empty state
                });
              } else {
                const numValue = parseInt(value);
                if (!isNaN(numValue)) {
                  setFormData({
                    ...formData,
                    servings: Math.max(1, Math.min(300, numValue)),
                  });
                }
              }
            }}
            onBlur={() => {
              // Ensure valid value when field loses focus
              if (formData.servings === 0) {
                setFormData({
                  ...formData,
                  servings: 1,
                });
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
