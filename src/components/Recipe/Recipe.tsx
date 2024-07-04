import {
  getRecipe,
  insertRecipe,
  deleteRecipe,
} from "../../helpers/recipe-helpers";
import { RecipeType } from "../../supabase-types";

function Recipe(props: RecipeType) {
  const handleGetRecipe = async () => {
    const recipe = await getRecipe(props.id);
    console.log("Recipe:", recipe);
  };

  // TODO sample data, replace with form data
  const handleInsertRecipe = async () => {
    const newRecipe: Omit<RecipeType, "id" | "created_at"> = {
      category_id: null,
      price: 9.99,
      name: "New Recipe",
      instructions: "Cook the new recipe",
      link: "https://www.example.com",
      servings: 4,
    };

    const insertedRecipe = await insertRecipe(newRecipe);
    console.log("Inserted Recipe:", insertedRecipe);
  };

  const handleDeleteRecipe = async () => {
    const success = await deleteRecipe(props.id);
    console.log("Recipe deleted:", success);
  };

  return (
    <>
      <div>Recipe</div>
      <p>{props.id}</p>
      <p>{props.category_id}</p>
      <p>{props.price}</p>
      <p>{props.name}</p>
      <p>{props.instructions}</p>
      <button onClick={handleGetRecipe}>Get Recipe</button>
      <button onClick={handleInsertRecipe}>Insert Recipe</button>
      <button onClick={handleDeleteRecipe}>Delete Recipe</button>
    </>
  );
}

export default Recipe;
