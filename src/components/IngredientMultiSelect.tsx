import { useState, useRef, useEffect } from "react";
import { ChevronDown, X, Plus } from "lucide-react";
import type { Tables } from "../types/database-types";
import type { RecipeIngredient } from "../types/recipe-form";
import { useUnits } from "../hooks/useUnits";

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
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null); // Add this ref

  const { data: units = [] } = useUnits();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      // Small delay to ensure the dropdown is rendered
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 0);
    }
  }, [isOpen]);

  const filteredIngredients = ingredients.filter(
    (ingredient) =>
      ingredient.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !selectedIngredients.some(
        (selected) => selected.ingredient_id === ingredient.id
      )
  );

  const addIngredient = (ingredient: Tables<"ingredients">) => {
    const newIngredient: RecipeIngredient = {
      ingredient_id: ingredient.id,
      ingredient_name: ingredient.name,
      unit_id: null,
      unit_name: "",
      unit_amount: undefined,
      note: "",
    };
    onIngredientsChange([...selectedIngredients, newIngredient]);
    setSearchTerm("");
    setIsOpen(false);
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
      <div className="relative" ref={dropdownRef}>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Ingredients
        </label>

        {/* Conditional rendering: Button OR Search bar */}
        {!isOpen ? (
          /* Dropdown trigger button */
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <span className="text-gray-500">Add ingredients...</span>
            <ChevronDown className="h-5 w-5 text-gray-400" />
          </button>
        ) : (
          /* Search bar with close button */
          <div className="flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search ingredients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 text-sm focus:outline-none bg-transparent"
            />
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setSearchTerm("");
              }}
              className="ml-2 p-1 hover:bg-gray-100 rounded focus:outline-none"
            >
              <ChevronDown className="h-5 w-5 text-gray-400 transform rotate-180" />
            </button>
          </div>
        )}

        {/* Dropdown menu - only the ingredient list */}
        {isOpen && (
          <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg">
            <div className="max-h-48 overflow-y-auto">
              {filteredIngredients.map((ingredient) => (
                <button
                  key={ingredient.id}
                  type="button"
                  onClick={() => addIngredient(ingredient)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center"
                >
                  <Plus className="h-4 w-4 text-green-500 mr-2" />
                  {ingredient.name}
                </button>
              ))}
              {filteredIngredients.length === 0 && (
                <div className="px-3 py-2 text-gray-500 text-sm">
                  No ingredients found
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Selected ingredients*/}
      {selectedIngredients.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">
            Selected Ingredients:
          </h4>
          {selectedIngredients.map((ingredient) => (
            <div
              key={ingredient.ingredient_id}
              className="p-3 bg-gray-50 rounded-md space-y-2"
            >
              <div className="flex-1 min-w-0">
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
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder=""
                    value={ingredient.unit_amount || ""}
                    onChange={(e) =>
                      updateIngredient(ingredient.ingredient_id, {
                        unit_amount: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value=""></option>
                    {units.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.abbreviation ? `${unit.name} (${unit.abbreviation})` : unit.name}
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
                    placeholder="e.g., 'diced', 'chopped fine'"
                    value={ingredient.note || ""}
                    onChange={(e) =>
                      updateIngredient(ingredient.ingredient_id, {
                        note: e.target.value,
                      })
                    }
                    className="w-full px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              {/* ^^^ end of row ^^^ */}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
