import { useRef } from "react";
import { X } from "lucide-react";
import type { Tables } from "../../types/database-types";
import type { RecipeIngredient } from "../../types/recipe-form";
import { useUnits } from "../../hooks/useUnits";
import {
  SearchableDropdown,
  type SearchableDropdownRef,
} from "./SearchableDropdown";

interface IngredientMultiSelectProps {
  ingredients: Tables<"ingredients">[];
  selectedIngredients: RecipeIngredient[];
  onIngredientsChange: (ingredients: RecipeIngredient[]) => void;
}

export const IngredientMultiSelect = ({
  ingredients,
  selectedIngredients,
  onIngredientsChange,
}: IngredientMultiSelectProps) => {
  const { data: units = [] } = useUnits();
  const dropdownRef = useRef<SearchableDropdownRef>(null);

  // Filter out already selected ingredients
  const availableIngredients = ingredients.filter(
    (ingredient) =>
      !selectedIngredients.some(
        (selected) => selected.ingredient_id === ingredient.id
      )
  );

  const addIngredient = (ingredient: Tables<"ingredients">) => {
    // Set default unit to the first unit in the list
    const defaultUnit = units[0];

    const newIngredient: RecipeIngredient = {
      ingredient_id: ingredient.id,
      ingredient_name: ingredient.name,
      unit_id: defaultUnit?.id || null,
      unit_name: defaultUnit?.name || "",
      unit_amount: undefined,
      note: "",
    };
    onIngredientsChange([...selectedIngredients, newIngredient]);
  };

  const removeIngredient = (ingredientId: number) => {
    onIngredientsChange(
      selectedIngredients.filter((ing) => ing.ingredient_id !== ingredientId)
    );
  };

  const updateIngredient = (
    ingredientId: number,
    updates: Partial<RecipeIngredient>
  ) => {
    onIngredientsChange(
      selectedIngredients.map((ing) =>
        ing.ingredient_id === ingredientId ? { ...ing, ...updates } : ing
      )
    );
  };

  const updateIngredientUnit = (
    ingredientId: number,
    unitId: string | null
  ) => {
    const selectedUnit = units.find((unit) => unit.id === unitId);
    updateIngredient(ingredientId, {
      unit_id: unitId,
      unit_name: selectedUnit?.name || "",
    });
  };

  return (
    <div className="space-y-4">
      {/* Selected ingredients display */}
      {selectedIngredients.length > 0 && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Selected Ingredients ({selectedIngredients.length})
          </label>
          {selectedIngredients.map((ingredient) => (
            <div
              key={ingredient.ingredient_id}
              className="p-2 bg-white rounded-lg border border-gray-300 shadow-sm"
            >
              <div className="flex-1 min-w-0 mb-2">
                <span className="font-medium text-sm text-gray-900">
                  {ingredient.ingredient_name}
                </span>
              </div>
              {/* Amount, Unit, notes and Remove button all on one row */}
              <div className="grid grid-cols-12 gap-3 items-end">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                  Amount
                  </label>
                  <input
                  type="text"
                  inputMode="decimal"
                  placeholder=""
                  value={ingredient.unit_amount || ""}
                  onChange={(e) =>
                    updateIngredient(ingredient.ingredient_id, {
                    unit_amount: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-2 py-1 h-8 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>

                <div className="col-span-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Unit
                  </label>
                  <select
                    value={ingredient.unit_id || ""}
                    onChange={(e) =>
                      updateIngredientUnit(
                        ingredient.ingredient_id,
                        e.target.value || null
                      )
                    }
                    className="w-full px-2 py-1 h-8 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {units.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.abbreviation
                          ? `${unit.name} (${unit.abbreviation})`
                          : unit.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-6">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Notes
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 'diced', 'finely chopped'"
                    value={ingredient.note || ""}
                    onChange={(e) =>
                      updateIngredient(ingredient.ingredient_id, {
                        note: e.target.value,
                      })
                    }
                    className="w-full px-3 py-1 h-8 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="col-span-1 flex justify-center">
                  <button
                    type="button"
                    onClick={() => removeIngredient(ingredient.ingredient_id)}
                    className="text-red-500 hover:text-red-700 p-1 flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add ingredient dropdown */}
      <SearchableDropdown
        ref={dropdownRef}
        label={
          selectedIngredients.length === 0
            ? "Ingredients"
            : "Add More Ingredients"
        }
        placeholder="Add ingredients..."
        searchPlaceholder="Search ingredients..."
        items={availableIngredients}
        onItemSelect={addIngredient}
        getItemId={(ingredient) => ingredient.id}
        getItemLabel={(ingredient) => ingredient.name}
        mode="single"
      />
    </div>
  );
};
