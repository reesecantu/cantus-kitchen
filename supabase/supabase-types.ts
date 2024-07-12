import { Database } from "./schema";

/**
 * ingredient related types
 */
export type IngredientType = Database['public']['Tables']['ingredient']['Row'];
export type InsertIngredientType = Database['public']['Tables']['ingredient']['Insert'];

export type IngredientCategoryType = Database['public']['Tables']['ingredient_category']['Row'];
export type InsertIngredientCategoryType = Database['public']['Tables']['ingredient_category']['Insert'];

export type IngredientUnitType = Database['public']['Tables']['ingredient_unit']['Row'];
export type InsertIngredientUnitType = Database['public']['Tables']['ingredient_unit']['Insert'];

/**
 * recipe related types
 */ 
export type RecipeType = Database['public']['Tables']['recipe']['Row'];
export type InsertRecipeType = Database['public']['Tables']['recipe']['Insert'];

export type RecipeCategoryType = Database['public']['Tables']['recipe_category']['Row'];
export type InsertRecipeCategoryType = Database['public']['Tables']['recipe_category']['Insert'];

export type RecipeIngredientType = Database['public']['Tables']['recipe_ingredient']['Row'];
export type InsertRecipeIngredientType = Database['public']['Tables']['recipe_ingredient']['Insert'];
