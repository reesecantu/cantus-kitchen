// import { useCallback, useState, useEffect } from "react";
// import supabase from "../../supabase-client";
import { IngredientCategoryType } from "../../../supabase/supabase-types";

function IngredientCategory(props: IngredientCategoryType) {
  return (
    <>
      <div>IngredientCategory</div>
      <p>{props.name}</p>
    </>
  );
}

export default IngredientCategory;
