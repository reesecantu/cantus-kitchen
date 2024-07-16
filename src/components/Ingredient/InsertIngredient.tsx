import supabase from "../../../supabase/supabase-client";
import {
  IngredientCategoryType,
  InsertIngredientType,
} from "../../../supabase/supabase-types";
import { useEffect, useState } from "react";
import Select from "react-select";
import Async, { useAsync } from 'react-select/async';

function InsertIngredient() {
  const [formData, setFormData] = useState<InsertIngredientType>({
    ingredient_name: "",
    category_id: -1,
  });

  const [ingredientCategoryOptions, setIngredientCategoryOption] = useState<
    IngredientCategoryType[]
  >([]);

  useEffect(() => {
    const setOptions = async () => {
      const { data, error } = await supabase
        .from("ingredient_category")
        .select();
      if (error) {
        console.error("Error fetching data:", error);
      } else {
        setIngredientCategoryOption(data);
      }
    };

    setOptions();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const { data, error } = await supabase
        .from("ingredient")
        .insert([{ ...formData }]);
      if (error) {
        throw error;
      }
      console.log("Inserted ingredient category:", data);
      setFormData({ ingredient_name: "", category_id: -1 });
    } catch (error) {
      console.error("Error inserting ingredient category:", error);
      alert("Error inserting ingredient category: " + error);
    }
  };

  return (
    <>
      <h2>Insert New Ingredient</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Ingredient Name:
          <input
            type="text"
            value={formData.ingredient_name}
            onChange={(e) =>
              setFormData({ ...formData, ingredient_name: e.target.value })
            }
          />
        </label>
        <br />
        <label>
          Category:
          <Select
            isClearable
            isSearchable
            name="Ingredient Category"
            options={ingredientCategoryOptions}
            getOptionValue={(option) => `${option["id"]}`}
          />
        </label>
      </form>
    </>
  );
}

export default InsertIngredient;
