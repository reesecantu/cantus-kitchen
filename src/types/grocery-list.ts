import type { Tables } from './database-types';

export type GroceryList = Tables<'grocery_lists'>;
export type GroceryListRecipe = Tables<'grocery_list_recipes'>;
export type GroceryListItem = Tables<'grocery_list_items'>;

export interface GroceryListWithStats extends GroceryList {
  recipe_count: number;
  item_count: number;
  completed_item_count: number;
}

export interface GroceryListItemWithDetails extends GroceryListItem {
  ingredient_name: string;
  unit_name: string;
  unit_abbreviation: string;
  grocery_aisle_id: number;
  grocery_aisle_name: string;
  grocery_aisle_display_order: number;
}

export interface GroceryListFull extends GroceryList {
  recipes: (GroceryListRecipe & { recipe_name: string })[];
  items: GroceryListItemWithDetails[];
}

export type GroceryListRecipeWithRecipe = {
  id: string;
  grocery_list_id: string | null;
  recipe_id: number | null;
  servings_multiplier: number | null;
  added_at: string | null;
  recipes: {
    name: string;
  } | null;
};

export type GroceryListItemForStats = {
  is_checked: boolean | null;
};

export type GroceryListItemWithRelations = Tables<"grocery_list_items"> & {
  ingredients:
    | (Tables<"ingredients"> & {
        grocery_aisles: Tables<"grocery_aisles"> | null;
      })
    | null;
  units: Tables<"units"> | null;
};

export type GroceryListItemTransformed = GroceryListItemWithRelations & {
  ingredient_name: string;
  unit_name: string;
  unit_abbreviation: string;
  grocery_aisle_id: number;
  grocery_aisle_name: string;
  grocery_aisle_display_order: number;
};