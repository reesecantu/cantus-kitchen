import "./App.css";
import {
  deleteRecipe,
  getRecipe,
  insertRecipe,
} from "./helpers/recipe-helpers";
import { RecipeType } from "./supabase-types";

function App() {
  const newRecipe: Omit<RecipeType, "id" | "created_at"> = {
    category_id: null,
    price: 9.99,
    name: "New Recipe",
    instructions: "Cook the new recipe",
    link: "https://www.example.com",
    servings: 4,
  };

  const handleGetRecipe = async () => {
    const recipe = await getRecipe(1);
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
    const success = await deleteRecipe(3);
    console.log("Recipe deleted:", success);
  };

  return (
    <>
      <h1>Hi Lily, I love yous</h1>
      <button onClick={handleGetRecipe}>Get Recipe</button>
      <button onClick={handleInsertRecipe}>Insert Recipe</button>
      <button onClick={handleDeleteRecipe}>Delete Recipe</button>
    </>
  );
}

export default App;
