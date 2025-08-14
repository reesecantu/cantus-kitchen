import { useGroceryListList } from "../../hooks/grocery-lists";
import { GroceryListTile } from "./GroceryListTile";
import { ROUTES } from "../../utils/constants";
import { Link } from "react-router";

export const GroceryListList = () => {
  const { data: groceryLists = [], isLoading, error } = useGroceryListList();

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
        <div className="text-gray-500">Create your first grocery list!</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {groceryLists.map((list) => (
        <Link to={ROUTES.GROCERY_LIST_DETAILS(list.id)}>
          <GroceryListTile key={list.id} list={list} />
        </Link>
      ))}
    </div>
  );
};
