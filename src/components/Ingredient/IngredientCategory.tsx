// import { useCallback, useState, useEffect } from "react";
// import supabase from "../../supabase-client";
import { IngredientCategoryType } from "../../supabase-types";

function IngredientCategory(ic: IngredientCategoryType) {
  
    


  return (
    <>
      <div>IngredientCategory</div>
      <p>{ic.name}</p>
    </>
  );
}

export default IngredientCategory;

// const [ingredientCategories, setIngredientCategories] =
// useState<IngredientCategoryType[]>();

// const fetcher = useCallback(async () => {
// const { data, error } = await supabase
//   .from("ingredient_category")
//   .select("*");
// if (error) {
//   console.error("error", error);
// } else {
//   setIngredientCategories(data);
// }
// }, []);
