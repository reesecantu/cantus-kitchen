import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  useToggleGroceryListItem,
  useAddManualItem,
} from "../hooks/useGroceryList";
import { supabase } from "../../supabase/supabase-client";
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

  const handleRemoveItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from("grocery_list_items")
        .delete()
        .eq("id", itemId);

      if (error) {
        console.error("Failed to remove item:", error);
      }
    } catch (error) {
      console.error("Failed to remove item:", error);
    }
  };

  // Group items by grocery aisle
  const itemsByAisle = groupBy(groceryList.items, "grocery_aisle_name");

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Shopping Items ({groceryList.items.length})
        </h2>
        <button
          onClick={() => setShowAddItem(!showAddItem)}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <Plus className="h-4 w-4" />
          Add Item
        </button>
      </div>

      {/* Add Manual Item Form */}
      {showAddItem && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-md font-medium mb-3">Add Manual Item</h3>
          <form onSubmit={handleAddManualItem} className="flex gap-2 flex-wrap">
            <input
              type="text"
              placeholder="Item name"
              value={newItem.name}
              onChange={(e) =>
                setNewItem((prev) => ({ ...prev, name: e.target.value }))
              }
              className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
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
              className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={newItem.unit}
              onChange={(e) =>
                setNewItem((prev) => ({ ...prev, unit: e.target.value }))
              }
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="piece">piece</option>
              <option value="cup">cup</option>
              <option value="lb">lb</option>
              <option value="oz">oz</option>
              <option value="can">can</option>
              <option value="pkg">pkg</option>
            </select>
            <input
              type="text"
              placeholder="Notes (optional)"
              value={newItem.notes}
              onChange={(e) =>
                setNewItem((prev) => ({ ...prev, notes: e.target.value }))
              }
              className="flex-1 min-w-[150px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={addManualItemMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {addManualItemMutation.isPending ? "Adding..." : "Add"}
            </button>
          </form>
        </div>
      )}

      {/* Grocery items by aisle */}
      {groceryList.items.length > 0 ? (
        <div className="space-y-6">
          {Object.entries(itemsByAisle).map(([aisleName, items]) => (
            <div
              key={aisleName}
              className="bg-white rounded-lg shadow-sm border"
            >
              <div className="px-4 py-3 bg-gray-50 border-b rounded-t-lg">
                <h3 className="text-lg font-medium text-gray-900">
                  {aisleName}
                </h3>
              </div>
              <div className="p-4 space-y-2">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 p-2 rounded transition-colors group ${
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
                      className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                    />
                    <div
                      className={`flex-1 ${
                        item.is_checked ? "line-through text-gray-500" : ""
                      }`}
                    >
                      <div className="font-medium">
                        {item.quantity} {item.unit_abbreviation}{" "}
                        {item.ingredient_name}
                      </div>
                      {item.notes && (
                        <div className="text-sm text-gray-600">
                          {item.notes}
                        </div>
                      )}
                      {item.source_recipes &&
                        item.source_recipes.length > 0 && (
                          <div className="text-xs text-gray-500">
                            From: {item.source_recipes.length} recipe(s)
                          </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                      {item.is_manual && (
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                          Manual
                        </span>
                      )}
                      {item.is_manual && (
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-1 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                          title="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
          No items in this grocery list yet. Add some recipes or manual items to
          get started.
        </div>
      )}
    </div>
  );
};
