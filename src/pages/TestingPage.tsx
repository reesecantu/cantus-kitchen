import { jwtDecode } from "jwt-decode";
import supabase from "../../supabase/supabase-client";

function TestingPage() {
  const recipe = {
    name: "test recipe",
    instructions:
      "Cook pasta according to package instructions. In a separate pan, cook the minced meat, then add tomato sauce.",
    servings: 4,
    link: "http://example.com/spaghetti-bolognese",
    price: 10.5,
  };

  const ingredients = [
    {
      ingredient_id: 1, // Assuming 1 corresponds to an existing ingredient in the database
      quantity: 200, // 200 grams of pasta
      unit: 2, // Assuming 2 corresponds to 'grams' in your units table
    },
    {
      ingredient_id: 2, // Assuming 2 corresponds to minced meat
      quantity: 300, // 300 grams of minced meat
      unit: 2, // Assuming 2 corresponds to 'grams'
    },
  ];

  const recipe_tags = [
    {
      tag_id: 1, // Assuming 1 corresponds to 'Italian' in your tags table
    },
    {
      tag_id: 2, // Assuming 2 corresponds to 'Pasta' in your tags table
    },
  ];

  // Function to test the insert
  async function testInsertRecipe() {
    const { data, error } = await supabase.rpc(
      "insert_recipe_with_ingredients_and_tags",
      {
        recipe,
        ingredients,
        recipe_tags,
      }
    );

    if (error) {
      console.error("Error inserting recipe:", error);
    } else {
      console.log("Recipe inserted successfully:", data);
    }
  }

  return (
    <>
      <h1>Testing page</h1>
      <button onClick={() => jwtDecode("")}>try to decode nothing</button>
      {/* <button onClick={testInsertRecipe}>insert test recipe</button> */}
      <button
        onClick={() =>
          console.log(
            "recipe json: ",
            recipe,
            "\ningredients json: ",
            ingredients,
            "\nrecipe tags json: ",
            recipe_tags
          )
        }
      >
        Log Test Recipe
      </button>
    </>
  );
}

export default TestingPage;
