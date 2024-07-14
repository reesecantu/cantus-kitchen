import supabase from "../../../supabase/supabase-client";
import { InsertIngredientUnitType } from "../../../supabase/supabase-types";
import { useState } from "react";

function InsertIngredientUnit() {
  const [formData, setFormData] = useState<InsertIngredientUnitType>({
    name: "",
  });

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, name: event.target.value });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const { data, error } = await supabase
        .from("ingredient_unit")
        .insert([{ ...formData }]);
      if (error) {
        throw error;
      }
      console.log("Inserted ingredient unit:", data);
      setFormData({ name: "" });
    } catch (error) {
      console.error("Error inserting ingredient unit:", error);
      alert("Error inserting ingredient unit: " + error);
    }
  };

  return (
    <div>
      <h2>Insert Ingredient Unit</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="Enter ingredient unit name"
        />
        <button type="submit">Insert</button>
      </form>
    </div>
  );
}

export default InsertIngredientUnit;
