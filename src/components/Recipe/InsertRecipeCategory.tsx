import supabase from "../../../supabase/supabase-client";
import { InsertRecipeTagType } from "../../../supabase/supabase-types";
import { useState } from "react";

function InsertRecipeCategory() {
  const [formData, setFormData] = useState<InsertRecipeTagType>({
    name: "",
  });

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, name: event.target.value });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const { data, error } = await supabase
        .from("recipe_tag")
        .insert([{ ...formData }]);
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
      <h2>Insert Recipe Tag</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="Enter new recipe tag"
        />
        <button type="submit">Insert</button>
      </form>
    </div>
  );
}

export default InsertRecipeCategory;
