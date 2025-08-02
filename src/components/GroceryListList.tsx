import { Link } from "react-router";
import { useGroceryLists } from "../hooks/useGroceryList";

export const GroceryListList = () => {
  const { data: groceryLists = [], isLoading, error } = useGroceryLists();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-500">Loading grocery lists...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-red-500">
          Error loading grocery lists. Please try again.
        </div>
      </div>
    );
  }

  if (groceryLists.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-500">
          Create your first grocery list!
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {groceryLists.map((list) => (
        <Link key={list.id} to={`/grocery-list/${list.id}`}>
          <div className="bg-white rounded-lg border transition-transform duration-200 cursor-pointer hover:-translate-y-1 group">
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:underline group-hover:decoration-2 group-hover:decoration-gray-700">
                {list.name}
              </h3>
              {list.description && (
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {list.description}
                </p>
              )}
              <div className="flex justify-between items-center text-sm text-gray-500">
                <div className="flex items-center space-x-4">
                  <span>{list.recipe_count} recipes</span>
                  <span>{list.item_count} items</span>
                </div>
                <div className="flex items-center">
                  {list.item_count > 0 && (
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>
                        {list.completed_item_count}/{list.item_count} done
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{list.is_completed ? "Completed" : "Active"}</span>
                  <span>{new Date(list.created_at).toLocaleDateString()}</span>
                </div>
                {list.item_count > 0 && (
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${
                          (list.completed_item_count / list.item_count) * 100
                        }%`,
                      }}
                    ></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};
