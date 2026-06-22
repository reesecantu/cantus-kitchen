import { describe, expect, it } from "vitest";
import {
  aggregateGroceryItems,
  findBestUnitForQuantity,
  roundQuantity,
  type RecipeForAggregation,
  type UnitInfo,
} from "./grocery-aggregation";

// Fixture mirroring the units table: ml is the base for volume, g for weight.
// Conversion factors match the real seed data.
const TSP = unit("tsp", "volume", "imperial", 4.93);
const TBSP = unit("tbsp", "volume", "imperial", 14.79);
const CUP = unit("cup", "volume", "imperial", 236.59);
const FLOZ = unit("floz", "volume", "imperial", 29.57);
const PINT = unit("pint", "volume", "imperial", 473.18);
const QUART = unit("quart", "volume", "imperial", 946.35);
const GALLON = unit("gallon", "volume", "imperial", 3785.41);
const ML = unit("ml", "volume", "metric", 1);
const OZ = unit("oz", "weight", "imperial", 28.35);
const POUND = unit("lb", "weight", "imperial", 453.59);
const GRAM = unit("g", "weight", "metric", 1);
const COUNT = unit("count", "count", "universal", null);
const CLOVE = unit("clove", "count", "universal", null);
const PINCH = unit("pinch", "volume", "imperial", null);

const UNITS: UnitInfo[] = [
  TSP, TBSP, CUP, FLOZ, PINT, QUART, GALLON, ML, OZ, POUND, GRAM, COUNT, CLOVE, PINCH,
];

function unit(
  id: string,
  type: string,
  system: string,
  baseConversionFactor: number | null
): UnitInfo {
  return { id, type, system, baseConversionFactor };
}

function recipe(
  recipeId: string,
  servingsMultiplier: number,
  originalServings: number,
  ingredients: RecipeForAggregation["ingredients"]
): RecipeForAggregation {
  return { recipeId, servingsMultiplier, originalServings, ingredients };
}

function ing(
  ingredientId: number,
  unitAmount: number | null,
  unitId: string | null,
  note: string | null = null
) {
  return { ingredientId, unitAmount, unitId, note };
}

describe("roundQuantity", () => {
  it("rounds to 2 decimals half away from zero like SQL ROUND", () => {
    expect(roundQuantity(2.675)).toBe(2.68); // classic float trap: 2.675*100 = 267.499…
    expect(roundQuantity(2.674)).toBe(2.67);
    expect(roundQuantity(2.665)).toBe(2.67);
    expect(roundQuantity(0.125)).toBe(0.13);
    expect(roundQuantity(5)).toBe(5);
    expect(roundQuantity(0)).toBe(0);
  });
});

describe("findBestUnitForQuantity", () => {
  it("prefers units landing in the natural 0.5–8 range", () => {
    // 473.18 ml: cup = 2 (tier 0), tbsp = 32 (tier 2), pint = 1 (tier 0)
    // cup wins over pint on the smaller-unit tiebreak
    expect(findBestUnitForQuantity(473.18, "volume", UNITS)).toBe("cup");
  });

  it("treats tier boundaries inclusively (first matching tier wins)", () => {
    // Exactly 8 cups: matches both 0.5–8 (tier 0) and 8–16 (tier 1); tier 0
    // wins — cup must still win over quart (q=2, also tier 0) on the
    // smaller-unit tiebreak
    expect(findBestUnitForQuantity(8 * 236.59, "volume", UNITS)).toBe("cup");
    // 16 cups = exactly 8 pints: 8 is inclusive in tier 0, so pint (q=8) beats
    // quart (q=4) and gallon (q=2) on the smaller-unit tiebreak
    expect(findBestUnitForQuantity(16 * 236.59, "volume", UNITS)).toBe("pint");
    // 3 gallons: quart = 12 (tier 1), pint/cup overflow into tiers 2–3,
    // gallon = 3 is the only tier-0 candidate
    expect(findBestUnitForQuantity(3 * 3785.41, "volume", UNITS)).toBe("gallon");
  });

  it("ignores metric units when imperial is preferred", () => {
    // 5 ml would be a perfect "5 ml" but system filter excludes it → ~1 tsp
    expect(findBestUnitForQuantity(5, "volume", UNITS)).toBe("tsp");
  });

  it("picks the largest unit when every unit overflows 48", () => {
    // 1,000,000 ml: even gallon = 264 (> 48) → pick the largest unit so the
    // number stays as small as possible
    expect(findBestUnitForQuantity(1_000_000, "volume", UNITS)).toBe("gallon");
  });

  it("picks the smallest unit when the quantity is microscopic", () => {
    // 0.1 ml: nothing reaches 0.125 → pick the smallest unit so the number
    // stays as large/readable as possible
    expect(findBestUnitForQuantity(0.1, "volume", UNITS)).toBe("tsp");
  });

  it("returns null when no unit of the type/system exists", () => {
    expect(findBestUnitForQuantity(100, "count", UNITS)).toBe(null);
  });
});

describe("aggregateGroceryItems", () => {
  it("returns no items for an empty recipe list", () => {
    expect(aggregateGroceryItems([], UNITS)).toEqual([]);
  });

  it("keeps quantities unchanged when multiplier equals servings", () => {
    const items = aggregateGroceryItems(
      [recipe("r1", 4, 4, [ing(1, 2, "cup")])],
      UNITS
    );
    expect(items).toEqual([
      {
        ingredient_id: 1,
        quantity: 2,
        unit_id: "cup",
        notes: null,
        source_recipes: ["r1"],
      },
    ]);
  });

  it("scales by servingsMultiplier / originalServings", () => {
    const items = aggregateGroceryItems(
      [recipe("r1", 8, 4, [ing(1, 2, "cup")])],
      UNITS
    );
    expect(items[0].quantity).toBe(4);
    expect(items[0].unit_id).toBe("cup");
  });

  it("aggregates the same ingredient across units and recipes", () => {
    // 2 cups + 8 tbsp = 473.18 + 118.32 = 591.5 ml → 2.5 cups
    const items = aggregateGroceryItems(
      [
        recipe("r1", 4, 4, [ing(1, 2, "cup")]),
        recipe("r2", 2, 2, [ing(1, 8, "tbsp")]),
      ],
      UNITS
    );
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(2.5);
    expect(items[0].unit_id).toBe("cup");
    expect(items[0].source_recipes).toEqual(["r1", "r2"]);
  });

  it("converts up to a more readable unit when totals grow", () => {
    // 32 tbsp = 473.28 ml ≈ 2 cups, not "32 tbsp"
    const items = aggregateGroceryItems(
      [recipe("r1", 4, 4, [ing(1, 32, "tbsp")])],
      UNITS
    );
    expect(items[0].unit_id).toBe("cup");
    expect(items[0].quantity).toBe(2);
  });

  it("keeps volume and weight buckets of one ingredient separate", () => {
    const items = aggregateGroceryItems(
      [recipe("r1", 1, 1, [ing(1, 1, "cup"), ing(1, 1, "lb")])],
      UNITS
    );
    expect(items).toHaveLength(2);
    const unitIds = items.map((i) => i.unit_id).sort();
    expect(unitIds).toEqual(["cup", "lb"]);
  });

  it("aggregates factor-less units as-is, per exact unit", () => {
    // 2 eggs + 3 eggs = 5 eggs; 2 cloves garlic stays its own row
    const items = aggregateGroceryItems(
      [
        recipe("r1", 1, 1, [ing(1, 2, "count"), ing(2, 2, "clove")]),
        recipe("r2", 1, 1, [ing(1, 3, "count")]),
      ],
      UNITS
    );
    const eggs = items.find((i) => i.ingredient_id === 1);
    const garlic = items.find((i) => i.ingredient_id === 2);
    expect(eggs).toMatchObject({
      quantity: 5,
      unit_id: "count",
      source_recipes: ["r1", "r2"],
    });
    expect(garlic).toMatchObject({ quantity: 2, unit_id: "clove" });
  });

  it("scales factor-less quantities too", () => {
    const items = aggregateGroceryItems(
      [recipe("r1", 6, 2, [ing(1, 2, "count")])],
      UNITS
    );
    expect(items[0].quantity).toBe(6);
  });

  it("preserves null quantities ('to taste') and merges per ingredient", () => {
    const items = aggregateGroceryItems(
      [
        recipe("r1", 1, 1, [ing(1, null, "pinch", "to taste")]),
        recipe("r2", 1, 1, [ing(1, null, "tsp", "to taste")]),
      ],
      UNITS
    );
    expect(items).toEqual([
      {
        ingredient_id: 1,
        quantity: null,
        unit_id: "pinch", // first recipe's unit wins, matching the SQL upsert
        notes: "to taste",
        source_recipes: ["r1", "r2"],
      },
    ]);
  });

  it("merges notes: null yields, equal dedupes, distinct join with '; '", () => {
    const items = aggregateGroceryItems(
      [
        recipe("r1", 1, 1, [ing(1, 1, "cup", null)]),
        recipe("r2", 1, 1, [ing(1, 1, "cup", "sifted")]),
        recipe("r3", 1, 1, [ing(1, 1, "cup", "sifted")]),
        recipe("r4", 1, 1, [ing(1, 1, "cup", "chilled")]),
      ],
      UNITS
    );
    expect(items[0].notes).toBe("sifted; chilled");
  });

  it("keeps duplicate source recipe ids like SQL array_cat", () => {
    // Same ingredient listed twice within one recipe
    const items = aggregateGroceryItems(
      [recipe("r1", 1, 1, [ing(1, 1, "cup"), ing(1, 1, "cup")])],
      UNITS
    );
    expect(items[0].source_recipes).toEqual(["r1", "r1"]);
    expect(items[0].quantity).toBe(2);
  });

  it("rounds converted quantities to 2 decimals", () => {
    // 1/3 cup scaled by 1: 78.86 ml → tier-0 pick is tbsp (5.33)
    const items = aggregateGroceryItems(
      [recipe("r1", 1, 3, [ing(1, 1, "cup")])],
      UNITS
    );
    expect(items[0].unit_id).toBe("tbsp");
    expect(items[0].quantity).toBe(5.33);
  });
});
