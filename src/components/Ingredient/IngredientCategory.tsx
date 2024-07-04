import React, { useState, useEffect } from "react";
import { supabase } from "/supabase";

function IngredientCategory() {
  const [name, setName] = useState("");

  useEffect(() => {
    getIngredientCategory();
  }, []);

  async function addIngredientCategory(name: string) {
    try {
      const { data, error } = await supabase // Destructuring our Supabase call
        .from("ingredient_category") // Get our "Groceries" table
        .insert({ name: name }) // Insert passed in name and price
        .single(); // Only insert it once
      if (error) throw error; // If there is an error, throw it
      window.location.reload(); // Load the window once complete
    } catch (error) {
      alert(error); // If an error is caught, alert it on screen
    }
  }

  async function getIngredientCategory() {
    try {
      const { data, error } = await supabase // Destructuring our Supabase call
        .from("ingredient_category") // Get our "Groceries" table
        .select("*"); // Select all data
      if (error) throw error; // If there is an error, throw it
      console.log(data); // Log the data to the console
    } catch (error) {
      alert(error); // If an error is caught, alert it on screen
    }
  }

  async function deleteIngredientCategory({ name }) {
    try {
      const { data, error } = await supabase // Destructuring our Supabase call
        .from("ingredient_category") // Get our "Groceries" table
        .delete() // Delete the data
        .eq("name", name); // Equal to the passed in name
      if (error) throw error; // If there is an error, throw it
      window.location.reload(); // Load the window once complete
    } catch (error) {
      alert(error); // If an error is caught, alert it on screen
    }
  }

  return (
    <div>
      <h1>Ingredient Category</h1>
      <button onClick={() => addIngredientCategory("Fruit")}>
        Add Ingredient Category
      </button>
      <button onClick={() => deleteIngredientCategory({ name: "Fruit" })}>
        Delete Ingredient Category
      </button>
    </div>
  );
}

export default IngredientCategory;
