import { Database } from "./schema";

export type IngredientType = Database['public']['Tables']['ingredient']['Row'];
export type IngredientCategoryType = Database['public']['Tables']['ingredient_category']['Row'];
export type IngredientUnitType = Database['public']['Tables']['ingredient_unit']['Row'];
export type RecipeType = Database['public']['Tables']['recipe']['Row'];
export type RecipeCategoryType = Database['public']['Tables']['recipe_category']['Row'];
export type RecipeIngredientType = Database['public']['Tables']['recipe_ingredient']['Row'];
