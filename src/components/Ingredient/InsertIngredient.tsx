import supabase from "../../../supabase/supabase-client";
import {
  IngredientCategoryType,
  InsertIngredientType,
} from "../../../supabase/supabase-types";
import { useState } from "react";
import AsyncSelect from "react-select/async";
import { capitalizeFirstLetter } from "../../helpers/insert-filter";
import "./insert.css";

function InsertIngredient() {
  const [formData, setFormData] = useState<InsertIngredientType>({
    ingredient_name: "",
    category_id: -1,
  });

  const loadOptions = (
    inputValue: string,
    callback: (options: IngredientCategoryType[]) => void
  ) => {
    setTimeout(async () => {
      const { data, error } = await supabase
        .from("ingredient_category")
        .select("*")
        .ilike("name", `%${inputValue}%`);
      if (error) {
        throw error;
      }
      console.log("Loaded ingredient categories:", data);
      callback(data);
    }, 2000);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const { data, error } = await supabase.from("ingredient").insert([
        {
          ...formData,
          ingredient_name: capitalizeFirstLetter(formData.ingredient_name),
        },
      ]);
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
    <div>
      <h2>Insert New Ingredient</h2>
      <form onSubmit={handleSubmit} className="container">
        <label>
          Ingredient Name:
          <input
            className="input"
            type="text"
            value={formData.ingredient_name}
            onChange={(e) =>
              setFormData({ ...formData, ingredient_name: e.target.value })
            }
            required
            placeholder="Enter ingredient name"
          />
        </label>
        <br />
        <label className="select">
          Category:
          <AsyncSelect
            isSearchable
            placeholder="Select category"
            loadOptions={loadOptions}
            defaultOptions
            cacheOptions
            getOptionLabel={(option) => option.name}
            getOptionValue={(option) => option.id.toString()}
            onChange={(selectedOption) =>
              setFormData({
                ...formData,
                category_id: selectedOption?.id || -1,
              })
            }
            required
            styles={{
              option: (provided) => ({
                ...provided,
                color: "black", // text color
              }),
              control: (provided) => ({
                ...provided,
                minHeight: "1.5rem",
              }),
            }}
          />
        </label>
        {/* <button type="button" onClick={() => console.log(formData)}>
                form data
            </button> */}
        <br />
        <button type="submit">Insert</button>
      </form>
    </div>
  );
}

export default InsertIngredient;
