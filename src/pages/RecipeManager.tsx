import InsertIngredient from "../components/Ingredient/InsertIngredient";
import InsertIngredientCategory from "../components/Ingredient/InsertIngredientCategory";
import InsertIngredientUnit from "../components/Ingredient/InsertIngredientUnit";
import InsertRecipeCategory from "../components/Recipe/InsertRecipeCategory";

/**
 * A page for managing recipes.
 *
 * @returns The rendered JSX elements.
 */
function RecipeManager() {
  return (
    <>
      <h1>Recipe Insert Forms</h1>
      <InsertIngredient />
      <InsertIngredientCategory />
      <InsertIngredientUnit />
      <InsertRecipeCategory />
    </>
  );
}

export default RecipeManager;
