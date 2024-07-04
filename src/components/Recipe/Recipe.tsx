import { useState, useEffect } from "react";
import { supabase } from "/supabase";

function Recipe() {
  const [name, setName] = useState(""); // Initialized as an empty string.
  const [price, setPrice] = useState(0.0); // Initialized as 0.0.
  const [groceries, setGroceries] = useState([]); // Initialized as an empty arr
  return <div>Recipe</div>;
}

export default Recipe;
