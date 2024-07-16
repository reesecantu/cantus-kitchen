import supabase from "../../../supabase/supabase-client";
import { InsertIngredientCategoryType } from "../../../supabase/supabase-types";
import { useState } from "react";
import { capitalizeFirstLetter } from "../../helpers/insert-filter";

function InsertIngredientCategory() {
  const [formData, setFormData] = useState<InsertIngredientCategoryType>({
    name: "",
  });

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, name: capitalizeFirstLetter(event.target.value) });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const { data, error } = await supabase
        .from("ingredient_category")
        .insert([{ ...formData, name: capitalizeFirstLetter(formData.name) }]);
      if (error) {
        throw error;
      }
      console.log("Inserted ingredient category:", data);
      setFormData({ name: "" });
    } catch (error) {
      console.error("Error inserting ingredient category:", error);
      alert("Error inserting ingredient category: " + error);
    }
  };

  return (
    <div>
      <h2>Insert Ingredient Category</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="Enter ingredient category name"
        />
        <button type="submit">Insert</button>
      </form>
    </div>
  );
}

export default InsertIngredientCategory;
