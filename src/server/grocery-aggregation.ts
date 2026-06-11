/**
 * Pure TypeScript port of the Postgres `regenerate_grocery_list_items` +
 * `find_best_unit_for_quantity` functions (see supabase/schema.sql). No I/O —
 * callers fetch the inputs and persist the output (see grocery-lists.server.ts).
 *
 * Parity caveat: SQL `numeric` is arbitrary-precision while JS numbers are
 * float64, so results at exact rounding midpoints can differ by ±0.01.
 */

export interface RecipeForAggregation {
  recipeId: string;
  /** grocery_list_recipes.servings_multiplier */
  servingsMultiplier: number;
  /** recipes.servings (NOT NULL, > 0 per check constraint) */
  originalServings: number;
  ingredients: Array<{
    ingredientId: number;
    /** recipe_ingredients.unit_amount — null means "to taste" */
    unitAmount: number | null;
    unitId: string | null;
    note: string | null;
  }>;
}

export interface UnitInfo {
  id: string;
  type: string; // volume | count | weight
  system: string; // imperial | metric | universal
  baseConversionFactor: number | null;
  cookingPriority: number | null;
}

export interface GeneratedItem {
  ingredient_id: number;
  quantity: number | null;
  unit_id: string | null;
  notes: string | null;
  source_recipes: string[];
}

/** SQL ROUND(numeric, 2): half away from zero. */
export function roundQuantity(value: number): number {
  const scaled = Math.abs(value) * 100;
  // toFixed(6) strips float artifacts (2.675 * 100 === 267.49999999999997)
  // before the half-up rounding decision
  const rounded = Math.round(Number(scaled.toFixed(6)));
  return (Math.sign(value) || 1) * (rounded / 100);
}

/** Merge rule used by every aggregation bucket in the SQL. */
function mergeNotes(current: string | null, incoming: string | null): string | null {
  if (current === null) return incoming;
  if (incoming === null) return current;
  if (current === incoming) return current;
  return `${current}; ${incoming}`;
}

/**
 * Port of `find_best_unit_for_quantity(p_base_quantity, p_unit_type, p_preferred_system)`.
 *
 * Scores candidate units by how "natural" the resulting quantity reads
 * (tier 0: 0.5–8, e.g. "2 cups"), then by cooking_priority, then by size.
 * The SQL ORDER BY has no deterministic tiebreak; we add unit id as a final
 * one, a harmless divergence.
 */
export function findBestUnitForQuantity(
  baseQuantity: number,
  unitType: string,
  units: UnitInfo[],
  preferredSystem = "imperial"
): string | null {
  const naturalRangeScore = (quantity: number): number => {
    // Mirrors the SQL CASE: evaluated in order, bounds inclusive
    if (quantity >= 0.5 && quantity <= 8) return 0;
    if (quantity >= 8 && quantity <= 16) return 1;
    if (quantity >= 0.25 && quantity <= 0.5) return 2;
    if (quantity >= 16 && quantity <= 32) return 2;
    return 3;
  };

  const convertible = units.filter(
    (u) =>
      u.type === unitType &&
      u.system === preferredSystem &&
      u.baseConversionFactor !== null &&
      u.baseConversionFactor > 0
  );

  // Primary: quantity lands in a displayable range (0.125–48)
  const primary = convertible
    .filter((u) => {
      const q = baseQuantity / u.baseConversionFactor!;
      return q >= 0.125 && q <= 48;
    })
    .sort(
      (a, b) =>
        naturalRangeScore(baseQuantity / a.baseConversionFactor!) -
          naturalRangeScore(baseQuantity / b.baseConversionFactor!) ||
        (a.cookingPriority ?? 10) - (b.cookingPriority ?? 10) ||
        a.baseConversionFactor! - b.baseConversionFactor! ||
        a.id.localeCompare(b.id)
    );
  if (primary.length > 0) return primary[0].id;

  // Fallback 1: any unit giving at least 0.125, preferring larger units
  const fallback = convertible
    .filter((u) => baseQuantity / u.baseConversionFactor! >= 0.125)
    .sort(
      (a, b) =>
        (a.cookingPriority ?? 10) - (b.cookingPriority ?? 10) ||
        b.baseConversionFactor! - a.baseConversionFactor! ||
        a.id.localeCompare(b.id)
    );
  if (fallback.length > 0) return fallback[0].id;

  // Fallback 2: any unit of the right type and system
  const any = units
    .filter((u) => u.type === unitType && u.system === preferredSystem)
    .sort(
      (a, b) =>
        (a.cookingPriority ?? 10) - (b.cookingPriority ?? 10) ||
        a.id.localeCompare(b.id)
    );
  return any.length > 0 ? any[0].id : null;
}

interface ConvertibleBucket {
  ingredientId: number;
  totalBaseQuantity: number;
  unitType: string;
  sourceRecipes: string[];
  notes: string | null;
}

interface NoConversionBucket {
  ingredientId: number;
  unitId: string | null;
  totalQuantity: number | null;
  sourceRecipes: string[];
  notes: string | null;
}

interface NullQuantityBucket {
  ingredientId: number;
  unitId: string | null; // first recipe's unit wins, matching the SQL upsert
  sourceRecipes: string[];
  notes: string | null;
}

/**
 * Port of `regenerate_grocery_list_items`, phases 1–4. Returns the generated
 * (non-manual) items for a list; persisting them (and preserving manual items)
 * is the caller's job via the `replace_generated_grocery_list_items` RPC.
 */
export function aggregateGroceryItems(
  recipes: RecipeForAggregation[],
  units: UnitInfo[]
): GeneratedItem[] {
  const unitsById = new Map(units.map((u) => [u.id, u]));

  const convertible = new Map<string, ConvertibleBucket>();
  const noConversion = new Map<string, NoConversionBucket>();
  const nullQuantity = new Map<number, NullQuantityBucket>();

  // PHASE 1: scale each recipe's ingredients and bucket them
  for (const recipe of recipes) {
    const scaleFactor = recipe.servingsMultiplier / recipe.originalServings;

    for (const ingredient of recipe.ingredients) {
      const unit = ingredient.unitId ? unitsById.get(ingredient.unitId) : undefined;
      const scaledQuantity =
        ingredient.unitAmount !== null ? ingredient.unitAmount * scaleFactor : null;

      if (ingredient.unitAmount === null) {
        // CASE A: no quantity ("salt to taste")
        const existing = nullQuantity.get(ingredient.ingredientId);
        if (existing) {
          existing.sourceRecipes.push(recipe.recipeId);
          existing.notes = mergeNotes(existing.notes, ingredient.note);
        } else {
          nullQuantity.set(ingredient.ingredientId, {
            ingredientId: ingredient.ingredientId,
            unitId: ingredient.unitId,
            sourceRecipes: [recipe.recipeId],
            notes: ingredient.note,
          });
        }
      } else if (unit?.baseConversionFactor == null) {
        // CASE B: no conversion factor — aggregate per exact unit ("2 eggs" + "3 eggs")
        const key = `${ingredient.ingredientId}|${ingredient.unitId}`;
        const existing = noConversion.get(key);
        if (existing) {
          existing.totalQuantity = (existing.totalQuantity ?? 0) + scaledQuantity!;
          existing.sourceRecipes.push(recipe.recipeId);
          existing.notes = mergeNotes(existing.notes, ingredient.note);
        } else {
          noConversion.set(key, {
            ingredientId: ingredient.ingredientId,
            unitId: ingredient.unitId,
            totalQuantity: scaledQuantity,
            sourceRecipes: [recipe.recipeId],
            notes: ingredient.note,
          });
        }
      } else {
        // CASE C: convertible — aggregate in base units (ml / g)
        const baseQuantity = scaledQuantity! * unit.baseConversionFactor;
        const key = `${ingredient.ingredientId}|${unit.type}`;
        const existing = convertible.get(key);
        if (existing) {
          existing.totalBaseQuantity += baseQuantity;
          existing.sourceRecipes.push(recipe.recipeId);
          existing.notes = mergeNotes(existing.notes, ingredient.note);
        } else {
          convertible.set(key, {
            ingredientId: ingredient.ingredientId,
            totalBaseQuantity: baseQuantity,
            unitType: unit.type,
            sourceRecipes: [recipe.recipeId],
            notes: ingredient.note,
          });
        }
      }
    }
  }

  const items: GeneratedItem[] = [];

  // PHASE 2: pick the most readable display unit and convert back
  for (const bucket of convertible.values()) {
    const bestUnitId = findBestUnitForQuantity(
      bucket.totalBaseQuantity,
      bucket.unitType,
      units,
      "imperial" // TODO: could become a user preference (same TODO as the SQL)
    );
    const bestUnit = bestUnitId ? unitsById.get(bestUnitId) : undefined;
    const convertedQuantity = bestUnit
      ? bestUnit.baseConversionFactor && bestUnit.baseConversionFactor > 0
        ? bucket.totalBaseQuantity / bestUnit.baseConversionFactor
        : bucket.totalBaseQuantity
      : null;

    items.push({
      ingredient_id: bucket.ingredientId,
      quantity: convertedQuantity !== null ? roundQuantity(convertedQuantity) : null,
      unit_id: bestUnitId,
      notes: bucket.notes,
      source_recipes: bucket.sourceRecipes,
    });
  }

  // PHASE 3: non-convertible units, aggregated as-is
  for (const bucket of noConversion.values()) {
    items.push({
      ingredient_id: bucket.ingredientId,
      quantity: bucket.totalQuantity !== null ? roundQuantity(bucket.totalQuantity) : null,
      unit_id: bucket.unitId,
      notes: bucket.notes,
      source_recipes: bucket.sourceRecipes,
    });
  }

  // PHASE 4: "to taste" ingredients keep their null quantity
  for (const bucket of nullQuantity.values()) {
    items.push({
      ingredient_id: bucket.ingredientId,
      quantity: null,
      unit_id: bucket.unitId,
      notes: bucket.notes,
      source_recipes: bucket.sourceRecipes,
    });
  }

  return items;
}
