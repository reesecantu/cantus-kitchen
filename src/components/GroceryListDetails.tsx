import { useGroceryList } from "../hooks/useGroceryList";
import { GroceryListRecipes } from "./GroceryListRecipes";
import { GroceryListItems } from "./GroceryListItems";

interface GroceryListDetailsProps {
  listId: string;
}

export const GroceryListDetails = ({ listId }: GroceryListDetailsProps) => {
  const { data: groceryList, isLoading } = useGroceryList(listId);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-500">Loading grocery list...</div>
      </div>
    );
  }

  if (!groceryList) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-500">Grocery list not found.</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {groceryList.name}
        </h1>
        {groceryList.description && (
          <p className="text-gray-600 mb-2">{groceryList.description}</p>
        )}
        <div className="text-sm text-gray-500">
          {groceryList.recipes.length} recipes • {groceryList.items.length}{" "}
          items
        </div>
      </div>

      {/* Recipes Section */}
      <GroceryListRecipes groceryList={groceryList} />

      {/* Items Section */}
      <GroceryListItems groceryList={groceryList} />
    </div>
  );
};
