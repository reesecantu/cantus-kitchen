export interface RecipeIngredient {
  ingredient_id: number;
  ingredient_name: string;
  unit_id?: string | null;
  unit_name?: string;
  unit_amount?: number;
  note?: string;
}

export interface RecipeFormData {
  name: string;
  steps: string[];     
  image_file?: File; 
  ingredients: RecipeIngredient[];
}