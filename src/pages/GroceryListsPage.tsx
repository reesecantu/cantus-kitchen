import { useNavigate } from "react-router";
import { GroceryListList } from "../components/GroceryListList";
import { useState } from "react";
import { useCreateGroceryList } from "../hooks/useGroceryList";
import { Plus } from "lucide-react";

export const GroceryListsPage = () => {
  const createGroceryListMutation = useCreateGroceryList();
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();

  const handleCreateGroceryList = async () => {
    setIsCreating(true);
    try {
      const newList = await createGroceryListMutation.mutateAsync({
        name: "Untitled Grocery List",
        description: "",
      });
      navigate(`/grocery-list/${newList.id}`);
    } catch (error) {
      console.error("Failed to create grocery list:", error);
    } finally {
      setIsCreating(false);
    }
  };

  // Otherwise, show the list of all grocery lists
  return (
    <div className="mx-10 md:mx-20 lg:mx-40 mt-20">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-700 mb-2">
            Grocery Lists
          </h1>
          <p className="text-md text-gray-600 font-medium w-full md:w-[80%]">
            On this page, you can access, edit, create, and delete your grocery
            lists
          </p>
        </div>
        <button
          onClick={handleCreateGroceryList}
          disabled={isCreating}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="h-5 w-5" />
          {isCreating ? "Creating..." : "New List"}
        </button>
      </div>

      <div className="mt-3 w-full text-center text-lg font-bold text-red-400">
        Filters and search bar go here
      </div>
      <div className="w-full h-2 bg-amber-400 rounded-full border-2 border-gray-700 mb-8" />

      {/* My Grocery Lists */}
      <GroceryListList />
    </div>
  );
};
