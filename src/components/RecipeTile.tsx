import type { Tables } from "../types/database-types";

interface RecipeTileProps {
  recipe: Tables<"recipes">;
}

export const RecipeTile = ({ recipe }: RecipeTileProps) => {
  return (
    <div className="overflow-hidden cursor-pointer transition-transform duration-200 hover:underline hover:decoration-2 hover:decoration-gray-700 hover:-translate-y-1">
      <div className="aspect-[3/2] w-full bg-gray-200 flex items-center justify-center">
        {recipe.image_url ? (
          <img
            src={recipe.image_url}
            alt={recipe.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-gray-400 text-center p-4">
            <svg
              className="w-12 h-12 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-sm">No Image</span>
          </div>
        )}
      </div>

      <div className="pt-1">
        <h3 className="text-lg font-medium text-gray-700 min-h-[3rem]">
          {recipe.name}
        </h3>
      </div>
    </div>
  );
};
