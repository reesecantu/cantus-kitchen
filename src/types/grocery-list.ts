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