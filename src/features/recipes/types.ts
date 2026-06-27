export interface RecipeIngredient {
  /**
   * Stable client-only identity for a form row. Lets the same ingredient appear
   * more than once (across groups) and survive reordering. Never persisted to
   * the DB and never sent in the mutation payload — generated with
   * `crypto.randomUUID()` in event handlers / when seeding state.
   */
  rowId: string;
  /**
   * Stable client-only identity for the group this row belongs to (mirrors
   * `rowId`). `undefined` = ungrouped. Lets two groups share a display name and
   * lets a group survive its name being cleared mid-edit. Never persisted and
   * never sent in the mutation payload — only `group_label` is stored.
   */
  groupId?: string;
  ingredient_id: number;
  ingredient_name: string;
  unit_id?: string | null;
  unit_name?: string;
  unit_amount?: number;
  note?: string;
  /** Section this ingredient belongs to; null/"" = ungrouped. */
  group_label?: string | null;
}

export interface RecipeFormData {
  name: string;
  steps: string[];
  image_file?: File;
  image_url?: string;
  ingredients: RecipeIngredient[];
  servings: number
}
