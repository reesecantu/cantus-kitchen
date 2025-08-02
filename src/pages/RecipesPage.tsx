import { RecipeList } from "../components/RecipeList"

export const RecipesPage = () => {
    return (
        <div className="mx-10 md:mx-20 lg:mx-40 mt-20">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-700 mb-2">Recipes</h1>
            <p className="text-md text-gray-600 font-medium w-full md:w-[80%]">
                Explore the recipes found on Cantu's Kitchen and used in my own life. Sign in to
                add and view your own recipes in addition to the ones you find here. Every recipe
                can be used in the grocery list generator. Check it out!
            </p>
            <div className="mt-3 w-full text-center text-lg font-bold text-red-400"> Filters and search bar go here </div>
            <div className="w-full h-2 bg-amber-400 rounded-full border-2 border-gray-700 mb-8" />
            {/* TODO MY Recipes list */}

            {/* Public recipes */}
            <RecipeList />
        </div>
    )
}