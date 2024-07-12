import { RecipeType } from "../../../supabase/supabase-types";

function Recipe(props: RecipeType) {
  return (
    <>
      <div>Recipe</div>
      <p>{props.id}</p>
      <p>{props.category_id}</p>
      <p>{props.price}</p>
      <p>{props.name}</p>
      <p>{props.instructions}</p>
    </>
  );
}

export default Recipe;
