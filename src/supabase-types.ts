import { Database } from "./schema";

export type IngredientCategoryType = Database['public']['Tables']['ingredient_category']['Row'];
export type RecipeType = Database['public']['Tables']['recipe']['Row'];