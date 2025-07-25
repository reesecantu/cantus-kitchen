import { RecipeList } from "../components/RecipeList"

export const RecipesPage = () => {
    return (
        <div className="mx-40 mt-20">
            <h1 className="text-5xl font-bold text-gray-700 mb-2">Reese's Recipes</h1>
            <p className="text-md text-gray-600 font-medium w-[80%]">
                Explore the recipes found on Cantu's Kitchen and used in my own life. Sign in to
                add and view your own recipes in addition to the ones you find here. Every recipe
                can be used in the grocery list generator. Check it out!
            </p>
            <div className="w-full h-2 bg-amber-400 rounded-full border-2 border-gray-700 mt-3 mb-8" />
            {/* TODO MY Recipes list */}

            {/* Public recipes */}
            <RecipeList />
        </div>
    )
}