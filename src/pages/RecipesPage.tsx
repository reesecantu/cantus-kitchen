import { useState } from "react";
import { RecipeList } from "../components/recipes/RecipeList";
import { COLORS } from "../utils/constants";
import { SearchInput } from "../components/ui/SearchInput";

export const RecipesPage = () => {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="mx-10 md:mx-20 lg:mx-40 my-20">
      <h1
        className={`text-4xl md:text-5xl font-bold ${COLORS.TEXT_PRIMARY} mb-2`}
      >
        Recipes
      </h1>
      <p
        className={`text-md ${COLORS.TEXT_SECONDARY} font-medium w-full md:w-[80%]`}
      >
        Explore the recipes found on Cantu's Kitchen and used in my own life.
        Sign in to add and view your own recipes in addition to the ones you
        find here. Every recipe can be used in the grocery list generator. Check
        it out!
      </p>
      <div className="flex  justify-center">
        <SearchInput
          value={searchTerm}
          onChange={(value) => setSearchTerm(value)}
          placeholder="Search recipes..."
          className="flex-grow"
        />
      </div>
      <div className="w-full h-2 bg-amber-400 rounded-full border-2 border-gray-700 mb-8" />
      {/* TODO MY Recipes list */}

      {/* Public recipes */}
      <RecipeList searchTerm={searchTerm} />
    </div>
  );
};
