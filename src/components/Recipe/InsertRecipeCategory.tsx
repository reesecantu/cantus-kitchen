import supabase from "../../../supabase/supabase-client";
import { InsertRecipeCategoryType } from "../../../supabase/supabase-types";
import { useState } from "react";

function InsertRecipeCategory() {
  const [formData, setFormData] = useState<InsertRecipeCategoryType>({
    name: "",
  });

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, name: event.target.value });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const { data, error } = await supabase
        .from("recipe_category")
        .insert([{ ...formData, id: undefined }]);
      if (error) {
        throw error;
      }
      console.log("Inserted recipe category:", data);
      setFormData({ name: "" });
    } catch (error) {
      console.error("Error inserting recipe category:", error);
      alert("Error inserting recipe category: " + error);
    }
  };

  return (
    <div>
      <h2>Insert Recipe Category</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="Enter recipe category name"
        />
        <button type="submit">Insert</button>
      </form>
    </div>
  );
}

export default InsertRecipeCategory;
