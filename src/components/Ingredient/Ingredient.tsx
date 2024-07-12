import { IngredientType } from "../../../supabase/supabase-types"


function Ingredient(props: IngredientType) {
return (
    <div>{JSON.stringify(props)}</div>
)
}

export default Ingredient