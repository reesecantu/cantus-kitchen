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
  name: string; // canonical unit name, e.g. "cup" — used to recognize cooking units
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
 * A candidate unit's role on the display "ladder", keyed off its canonical name:
 *  - `sourceOnly` units (fl oz, pint) clutter a list and are never auto-chosen.
 *    They display only when the recipe was written in them, and only until the
 *    next standard unit reaches 1 — the `keepBelowName` unit, whose real factor is
 *    resolved from the unit list (so there are no hardcoded conversion numbers).
 *  - ladder units carry a `min`: the smallest quantity at which we promote to
 *    this unit. cup promotes at 1/4 (so "1/4 cup" beats "4 Tbsp"); quart/gallon
 *    only at a whole unit; tsp/oz have min 0, making them the small-amount
 *    fallback. The weight oz→lb crossover depends on whether the recipe used oz.
 */
type UnitRole =
  | { sourceOnly: true; keepBelowName: string }
  | { sourceOnly: false; min: number };

function classifyUnit(
  name: string,
  unitType: string,
  ozInSource: boolean
): UnitRole {
  if (unitType === "weight") {
    if (name === "ounce") return { sourceOnly: false, min: 0 };
    if (name === "pound") return { sourceOnly: false, min: ozInSource ? 1 : 0.25 };
    return { sourceOnly: false, min: 1 };
  }
  // volume (the only other convertible type today)
  if (name === "fluid ounce") return { sourceOnly: true, keepBelowName: "cup" };
  if (name === "pint") return { sourceOnly: true, keepBelowName: "quart" };
  if (name === "cup") return { sourceOnly: false, min: 0.25 };
  if (name === "teaspoon") return { sourceOnly: false, min: 0 };
  return { sourceOnly: false, min: 1 }; // tablespoon, quart, gallon, or unknown
}

/**
 * Pick the display unit for a quantity expressed in base units (ml / g),
 * choosing the unit a home cook would actually reach for.
 *
 * The standard ladder (tsp → Tbsp → cup → quart → gallon for volume, oz → lb for
 * weight) picks the largest unit whose displayed quantity clears that unit's
 * promotion threshold. fl oz and pint sit off the ladder: they only appear when
 * the recipe itself used them (`sourceUnitIds`) and only while the number stays
 * smaller than the next standard unit. Ounces likewise stay ounces all the way to
 * a pound when the recipe used ounces, but otherwise give way to pounds at 1/4 lb.
 */
export function findBestUnitForQuantity(
  baseQuantity: number,
  unitType: string,
  units: UnitInfo[],
  preferredSystem = "imperial",
  sourceUnitIds: string[] = []
): string | null {
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
      name: u.name,
      factor: u.baseConversionFactor!,
      q: baseQuantity / u.baseConversionFactor!,
    }));
  if (candidates.length === 0) return null;

  // Real conversion factor of each candidate unit, by name — lets a source-only
  // unit's "keep below the next standard unit" threshold come from the data.
  const factorByName = new Map(candidates.map((c) => [c.name, c.factor]));

  const sourceSet = new Set(sourceUnitIds);
  const ozInSource = candidates.some(
    (c) => c.name === "ounce" && sourceSet.has(c.id)
  );
  const classified = candidates.map((c) => ({
    ...c,
    role: classifyUnit(c.name, unitType, ozInSource),
  }));

  // Step 1: source-only units (fl oz, pint). Only honor them when the recipe was
  // written *entirely* in them — if any ladder unit is also a source, prefer the
  // ladder. Keep them only while smaller than the next standard unit.
  const ladderInSource = classified.some(
    (c) => !c.role.sourceOnly && sourceSet.has(c.id)
  );
  if (!ladderInSource) {
    const kept = classified
      .filter((c) => {
        if (!c.role.sourceOnly || !sourceSet.has(c.id) || c.q < 1) return false;
        // Upgrade once we'd have ≥ 1 of the next standard unit. If that unit
        // isn't available, there's nothing to upgrade to, so keep this one.
        const keepBelow = factorByName.get(c.role.keepBelowName) ?? Infinity;
        return baseQuantity < keepBelow;
      })
      .sort((a, b) => b.factor - a.factor || a.id.localeCompare(b.id));
    if (kept.length > 0) return kept[0].id;
  }

  // Step 2: standard ladder — never includes source-only units. Pick the largest
  // unit whose quantity clears its promotion threshold; the smallest unit (min 0)
  // is the guaranteed fallback for tiny amounts. The relative EPSILON absorbs the
  // rounding in real conversion factors, which aren't exact multiples of each
  // other: 3 real teaspoons is 0.99997 of a tablespoon, and without slack a clean
  // "1 Tbsp" would fall back to "tsp" (likewise 4 cups → quart, 16 cups → gallon).
  // The slack (0.01%) dwarfs the factor noise (~3e-6) yet is far below any amount a
  // cook would meaningfully enter just under a threshold.
  const EPSILON = 1e-4;
  const ladder = classified
    .filter(
      (c): c is typeof c & { role: { sourceOnly: false; min: number } } =>
        !c.role.sourceOnly
    )
    .sort((a, b) => b.factor - a.factor || a.id.localeCompare(b.id));
  for (const c of ladder) {
    if (c.q >= c.role.min * (1 - EPSILON)) return c.id;
  }

  // No ladder units (e.g. a type with only source-only units): fall back to the
  // smallest candidate so the number stays as readable as possible.
  const smallest = [...candidates].sort(
    (a, b) => a.factor - b.factor || a.id.localeCompare(b.id)
  );
  return smallest[0].id;
}

interface ConvertibleBucket {
  ingredientId: number;
  totalBaseQuantity: number;
  unitType: string;
  sourceRecipes: string[];
  sourceUnitIds: string[];
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
          existing.sourceUnitIds.push(ingredient.unitId!);
          existing.notes = mergeNotes(existing.notes, ingredient.note);
        } else {
          convertible.set(key, {
            ingredientId: ingredient.ingredientId,
            totalBaseQuantity: baseQuantity,
            unitType: unit.type,
            sourceRecipes: [recipe.recipeId],
            sourceUnitIds: [ingredient.unitId!],
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
      "imperial", // TODO: could become a user preference
      bucket.sourceUnitIds
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
