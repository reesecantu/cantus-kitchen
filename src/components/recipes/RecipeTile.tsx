
import { Image } from "lucide-react";
import type { Tables } from "../../types/database-types";

interface RecipeTileProps {
  recipe: Tables<"recipes">;
}

export const RecipeTile = ({ recipe }: RecipeTileProps) => {
  return (
    <div className="overflow-hidden cursor-pointer transition-transform duration-200 hover:-translate-y-1 group">
      <div className="aspect-[3/2] w-full bg-gray-200 flex items-center justify-center">
        {recipe.image_url ? (
          <img
            src={recipe.image_url}
            alt={recipe.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="aspect-[3/2] w-full flex flex-col items-center justify-center text-gray-400 text-center p-1 md:p-4">
            <Image className="w-9 h-9 md:w-12 md:h-12" />
            <span className="text-sm">No Image</span>
          </div>
        )}
      </div>

      <div className="pt-1">
        <h3 className="text-lg font-medium text-gray-700 min-h-[3rem] group-hover:underline group-hover:decoration-2 group-hover:decoration-gray-700">
          {recipe.name}
        </h3>
      </div>
    </div>
  );
};
