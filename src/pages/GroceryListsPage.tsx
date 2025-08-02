import { GroceryListList } from "../components/GroceryListList"


export const GroceryListsPage = () => {
    return (
        <div className="mx-10 md:mx-20 lg:mx-40 mt-20">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-700 mb-2">Grocery Lists</h1>
            <p className="text-md text-gray-600 font-medium w-full md:w-[80%]">
                On this page, you can access, edit, create, and delete your grocery lists 
            </p>
            <div className="mt-3 w-full text-center text-lg font-bold text-red-400"> Filters and search bar go here </div>
            <div className="w-full h-2 bg-amber-400 rounded-full border-2 border-gray-700 mb-8" />
            
            {/* My Grocery Lists */}
            <GroceryListList />
        </div>
    )
}