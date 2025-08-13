import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  useToggleGroceryListItem,
  useAddManualItem,
  useRemoveGroceryListItem,
  useAutoUpdateCompletion, // Add this import
} from "../hooks/useGroceryList";
import { useUnits } from "../hooks/useUnits";
import type { GroceryListFull } from "../types/grocery-list";

interface GroceryListItemsProps {
  groceryList: GroceryListFull;
}

// Simple groupBy utility function
const groupBy = <T,>(array: T[], key: keyof T): Record<string, T[]> => {
  return array.reduce((groups, item) => {
    const groupKey = String(item[key]);
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(item);
    return groups;
  }, {} as Record<string, T[]>);
};

export const GroceryListItems = ({ groceryList }: GroceryListItemsProps) => {
  const toggleItemMutation = useToggleGroceryListItem();
  const addManualItemMutation = useAddManualItem();
  const removeItemMutation = useRemoveGroceryListItem();
  const { data: units = [] } = useUnits();

  // Auto-update completion status
  const { isUpdatingCompletion } = useAutoUpdateCompletion(groceryList);

  const [showAddItem, setShowAddItem] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    quantity: 1,
    unit: "piece",
    notes: "",
  });

  const handleToggleItem = (itemId: string, currentStatus: boolean | null) => {
    toggleItemMutation.mutate({
      itemId,
      isChecked: !currentStatus,
    });
  };

  const handleAddManualItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addManualItemMutation.mutateAsync({
        listId: groceryList.id,
        ingredientName: newItem.name,
        quantity: newItem.quantity,
        unitName: newItem.unit,
        notes: newItem.notes || undefined,
      });
      setNewItem({ name: "", quantity: 1, unit: "piece", notes: "" });
      setShowAddItem(false);
    } catch (error) {
      console.error("Failed to add item:", error);
    }
  };

  const handleRemoveItem = (itemId: string) => {
    removeItemMutation.mutate(itemId);
  };

  // Group items by grocery aisle
  const itemsByAisle = groupBy(groceryList.items, "grocery_aisle_name");

  // Sort aisles by display order
  const sortedAisles = Object.keys(itemsByAisle).sort((a, b) => {
    const aisleBItems = itemsByAisle[b];
    const aisleAItems = itemsByAisle[a];
    const orderA = aisleAItems[0]?.grocery_aisle_display_order || 999;
    const orderB = aisleBItems[0]?.grocery_aisle_display_order || 999;
    return orderA - orderB;
  });

  // Calculate stats
  const totalItems = groceryList.items.length;
  const checkedItems = groceryList.items.filter(
    (item) => item.is_checked
  ).length;
  const completionPercentage =
    totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

  return (
    <div>
      {/* Header with stats */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-gray-900">Grocery List</h2>
          {/* Optional: Show completion status */}
          {groceryList.is_completed && (
            <div className="flex items-center gap-2 text-green-600 text-sm">
              <div className="w-2 h-2 bg-green-600 rounded-full"></div>
              Completed
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                groceryList.is_completed ? "bg-green-600" : "bg-blue-600"
              }`}
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <span className="text-sm text-gray-600">
            {checkedItems} of {totalItems} items ({completionPercentage}%)
          </span>
          {/* Show updating status */}
          {isUpdatingCompletion && (
            <div className="text-xs text-gray-400">Updating...</div>
          )}
        </div>
      </div>

      {/* Items grouped by aisle */}
      {groceryList.items.length > 0 ? (
        <div className="space-y-4 mb-8">
          {sortedAisles.map((aisleName) => {
            const items = itemsByAisle[aisleName];
            const aisleCheckedCount = items.filter(
              (item) => item.is_checked
            ).length;

            return (
              <div key={aisleName} className="">
                <div className="px-2 py-1.5 flex justify-between items-center">
                  <h3 className="text-sm font-medium text-gray-900">
                    {aisleName}
                  </h3>
                  <span className="text-xs text-gray-500">
                    {aisleCheckedCount} / {items.length}
                  </span>
                </div>
                <div className="divide-y divide-gray-100 rounded-lg overflow-hidden border border-gray-700 shadow-md">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center gap-3 px-4 py-3 transition-colors group ${
                        item.is_checked
                          ? "bg-green-50 opacity-75"
                          : "bg-white hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={!!item.is_checked}
                        onChange={() =>
                          handleToggleItem(item.id, item.is_checked)
                        }
                        className="w-3 h-3 text-green-600 rounded focus:ring-green-500 cursor-pointer"
                      />
                      <div
                        className={`flex-1 text-sm ${
                          item.is_checked ? "line-through text-gray-500" : ""
                        }`}
                      >
                        <div className="flex items-baseline gap-2">
                          <span className="font-medium text-gray-900">
                            {item.quantity} {item.unit_abbreviation}
                          </span>
                          <span className="text-gray-700">
                            {item.ingredient_name}
                          </span>
                        </div>
                        {item.notes && (
                          <div className="text-sm text-gray-500 ">
                            Note: {item.notes}
                          </div>
                        )}
                      </div>
                      {item.is_manual && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            Manual
                          </span>
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            disabled={removeItemMutation.isPending}
                            className="p-1 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                            title="Remove item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg mb-8">
          {groceryList.recipes.length > 0 ? (
            <div>
              <div className="animate-pulse flex justify-center mb-4">
                <div className="h-8 w-8 bg-gray-300 rounded-full" />
              </div>
              <p>Generating items from recipes...</p>
            </div>
          ) : (
            <p>
              No items yet. Add recipes above to automatically generate your
              shopping list.
            </p>
          )}
        </div>
      )}

      {/* Add Manual Item Section at the bottom */}
      <div className="border-t pt-6">
        {!showAddItem ? (
          <button
            onClick={() => setShowAddItem(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Custom Item
          </button>
        ) : (
          <div className="p-4 bg-white rounded-lg border border-gray-800">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-md font-medium">Add Custom Item</h3>
              <button
                onClick={() => setShowAddItem(false)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
            <form onSubmit={handleAddManualItem} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Item name"
                  value={newItem.name}
                  onChange={(e) =>
                    setNewItem((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  autoFocus
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    placeholder="Qty"
                    value={newItem.quantity}
                    onChange={(e) =>
                      setNewItem((prev) => ({
                        ...prev,
                        quantity: parseFloat(e.target.value) || 1,
                      }))
                    }
                    className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={newItem.unit}
                    onChange={(e) =>
                      setNewItem((prev) => ({ ...prev, unit: e.target.value }))
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {units.map((unit) => (
                      <option key={unit.id} value={unit.name}>
                        {unit.abbreviation
                          ? `${unit.name} (${unit.abbreviation})`
                          : unit.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <input
                type="text"
                placeholder="Notes (optional)"
                value={newItem.notes}
                onChange={(e) =>
                  setNewItem((prev) => ({ ...prev, notes: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={addManualItemMutation.isPending}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addManualItemMutation.isPending ? "Adding..." : "Add Item"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
