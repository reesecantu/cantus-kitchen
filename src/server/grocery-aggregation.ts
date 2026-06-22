/**
 * Grocery-list aggregation engine. No I/O — callers fetch the inputs and persist
 * the output (see grocery-lists.server.ts). Scales each recipe's ingredients,
 * aggregates them in base units, and picks a readable display unit.
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
}

export interface GeneratedItem {
  ingredient_id: number;
  quantity: number | null;
  unit_id: string | null;
  notes: string | null;
  source_recipes: string[];
}

/** Round to 2 decimals, half away from zero. */
export function roundQuantity(value: number): number {
  const scaled = Math.abs(value) * 100;
  // toFixed(6) strips float artifacts (2.675 * 100 === 267.49999999999997)
  // before the half-up rounding decision
  const rounded = Math.round(Number(scaled.toFixed(6)));
  return (Math.sign(value) || 1) * (rounded / 100);
}

/** Merge rule used by every aggregation bucket. */
function mergeNotes(current: string | null, incoming: string | null): string | null {
  if (current === null) return incoming;
  if (incoming === null) return current;
  if (current === incoming) return current;
  return `${current}; ${incoming}`;
}

/**
 * Pick the display unit for a quantity expressed in base units (ml / g).
 *
 * Scores candidate units by how "natural" the resulting quantity reads
 * (tier 0: 0.5–8, e.g. "2 cups"), breaking ties toward the smaller unit (so the
 * number reads larger and more precise). When no unit lands in a readable range:
 * for a huge total, pick the largest unit so the number stays small (gallons,
 * not cups); for a tiny total, pick the smallest unit so the number stays
 * readable (tsp, not cups). Unit id is the final, deterministic tiebreak.
 */
export function findBestUnitForQuantity(
  baseQuantity: number,
  unitType: string,
  units: UnitInfo[],
  preferredSystem = "imperial"
): string | null {
  // Lower score = more natural-reading quantity. The ranges overlap at their
  // inclusive bounds on purpose: the first matching tier wins, which is what
  // makes e.g. 8 cups read as "cup" (tier 0) rather than "quart".
  const naturalRangeScore = (quantity: number): number => {
    if (quantity >= 0.5 && quantity <= 8) return 0;
    if (quantity >= 8 && quantity <= 16) return 1;
    if (quantity >= 0.25 && quantity <= 0.5) return 2;
    if (quantity >= 16 && quantity <= 32) return 2;
    return 3;
  };

  // Candidate units of the right type/system, each paired with the quantity (q)
  // it would display. q is computed once here so the passes below never re-divide.
  const candidates = units
    .filter(
      (u) =>
        u.type === unitType &&
        u.system === preferredSystem &&
        u.baseConversionFactor !== null &&
        u.baseConversionFactor > 0
    )
    .map((u) => ({
      id: u.id,
      factor: u.baseConversionFactor!,
      q: baseQuantity / u.baseConversionFactor!,
    }));

  // Primary: q lands in a displayable range (0.125–48) — prefer the most natural
  // range, then the smaller unit (larger, more precise number).
  const primary = candidates
    .filter((c) => c.q >= 0.125 && c.q <= 48)
    .sort(
      (a, b) =>
        naturalRangeScore(a.q) - naturalRangeScore(b.q) ||
        a.factor - b.factor ||
        a.id.localeCompare(b.id)
    );
  if (primary.length > 0) return primary[0].id;

  // Overflow: total too large for any unit's range — pick the largest unit so
  // the number stays as small as possible (gallons over cups).
  const overflow = candidates
    .filter((c) => c.q >= 0.125)
    .sort((a, b) => b.factor - a.factor || a.id.localeCompare(b.id));
  if (overflow.length > 0) return overflow[0].id;

  // Underflow: total too small for any unit's range — pick the smallest unit so
  // the number stays as large/readable as possible (tsp over cups).
  const underflow = [...candidates].sort(
    (a, b) => a.factor - b.factor || a.id.localeCompare(b.id)
  );
  return underflow.length > 0 ? underflow[0].id : null;
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
  unitId: string | null; // first recipe's unit wins
  sourceRecipes: string[];
  notes: string | null;
}

/**
 * Aggregate a list's recipes into generated (non-manual) grocery items, in four
 * phases. Persisting them (and preserving manual items) is the caller's job via
 * the `replace_generated_grocery_list_items` RPC.
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
      "imperial" // TODO: could become a user preference
    );
    // findBestUnitForQuantity only ever returns convertible units (factor > 0),
    // so dividing by the factor is always valid; null means no unit was found.
    const bestUnit = bestUnitId ? unitsById.get(bestUnitId) : undefined;
    const convertedQuantity = bestUnit
      ? bucket.totalBaseQuantity / bestUnit.baseConversionFactor!
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
