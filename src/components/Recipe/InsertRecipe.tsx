import { useState } from "react";
import AsyncSelect from "react-select/async";
import {
  InsertRecipeType,
  RecipeTagType,
} from "../../../supabase/supabase-types";
import supabase from "../../../supabase/supabase-client";
import "./InsertRecipe.css";

function InsertRecipe() {
  const initFormData = (): InsertRecipeType => {
    return {
      name: "",
      instructions: "",
      link: "",
      price: null,
      servings: null,
    };
  };

  const initTags = (): RecipeTagType[] => {
    return [];
  }

  const [formData, setFormData] = useState<InsertRecipeType>(initFormData());
  const [selectedTags, setSelectedTags] = useState<RecipeTagType[]>([]);

  /**
   * Load options for the recipe category select input
   */
  const loadOptions = (
    inputValue: string,
    callback: (options: RecipeTagType[]) => void
  ) => {
    setTimeout(async () => {
      const { data, error } = await supabase
        .from("recipe_tag")
        .select("*")
        .ilike("name", `%${inputValue}%`);
      if (error) {
        throw error;
      }
      console.log("Loaded recipe tags", data);
      callback(data);
    }, 2000);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const { data, error } = await supabase
        .from("recipe")
        .insert([{ ...formData }]);
      if (error) {
        throw error;
      }
      console.log("Inserted recipe tag:", data);
      setFormData(initFormData());
    } catch (error) {
      console.error("Error inserting recipe:", error);
      alert("Error inserting recipe: " + error);
    }
  };
  return (
    <div>
      <h2>Insert a new Recipe</h2>
      <form onSubmit={handleSubmit} className="container">
        <label>
          Recipe Name:
          <input
            type="text"
            value={formData.name}
            onChange={(event) =>
              setFormData({ ...formData, name: event.target.value })
            }
            placeholder="Enter recipe name"
            required
          />
        </label>
        <label>
          Recipe tag(s):
          <AsyncSelect
            isSearchable
            isMulti
            placeholder="Select Tag(s)"
            loadOptions={loadOptions}
            defaultOptions
            cacheOptions
            getOptionLabel={(option) => option.name}
            getOptionValue={(option) => option.id.toString()}
            required
            onChange={(selectedOptions) =>
              setSelectedTags(selectedOptions as RecipeTagType[])
            }
            styles={{
              option: (provided) => ({
                ...provided,
                color: "black", // text color
              }),
            }}
          />
        </label>
        <label>
          Instructions:
          <textarea
            value={formData.instructions ?? ""}
            onChange={(event) =>
              setFormData({ ...formData, instructions: event.target.value })
            }
            placeholder="Enter recipe instructions"
            required
          />
        </label>
        <label>
          Link:
          <input
            type="text"
            value={formData.link ?? ""}
            onChange={(event) =>
              setFormData({ ...formData, link: event.target.value })
            }
            placeholder="Enter recipe link"
          />
        </label>
        <label>
          Price:
          <input
            type="number"
            value={formData.price ?? ""}
            onChange={(event) =>
              setFormData({
                ...formData,
                price: event.target.value ? Number(event.target.value) : null,
              })
            }
            placeholder="Enter recipe price"
          />
        </label>
        <label>
          Servings:
          <input
            type="number"
            value={formData.servings ?? ""}
            onChange={(event) =>
              setFormData({
                ...formData,
                servings: event.target.value
                  ? Number(event.target.value)
                  : null,
              })
            }
            placeholder="Enter recipe servings"
          />
        </label>
        <button type="submit">Insert</button>
      </form>
    </div>
  );
}

export default InsertRecipe;
