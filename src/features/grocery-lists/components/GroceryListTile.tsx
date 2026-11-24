import { Users } from "lucide-react";
import type { GroceryListWithStats } from "../types";

interface GroceryListTileProps {
  list: GroceryListWithStats;
}

export const GroceryListTile = ({ list }: GroceryListTileProps) => {
  return (
    <div className="bg-white rounded-lg border transition-transform duration-200 cursor-pointer hover:-translate-y-1 group">
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-lg font-semibold text-gray-900 group-hover:underline group-hover:decoration-2 group-hover:decoration-gray-700">
            {list.name}
          </h3>
          {list.is_shared && (
            <span className="flex shrink-0 items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
              <Users className="h-3 w-3" aria-hidden="true" />
              Shared
            </span>
          )}
        </div>
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
        <div className="mt-1">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>{new Date(list.created_at).toLocaleDateString()}</span>
            <span>{list.is_completed ? "Completed" : "Not Completed"}</span>
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
  );
};
