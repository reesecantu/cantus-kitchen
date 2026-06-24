import { describe, expect, it } from "vitest";
import {
  aggregateGroceryItems,
  findBestUnitForQuantity,
  roundQuantity,
  type RecipeForAggregation,
  type UnitInfo,
} from "./grocery-aggregation";

// Fixture mirroring the units table: ml is the base for volume, g for weight.
// Conversion factors match the real seed data. The `_ML`/`_G` constants let the
// tests express amounts in human terms (`4 * TBSP_ML`) while the `unit()`
// fixtures below stay in sync with them.
const TSP_ML = 4.93;
const TBSP_ML = 14.79;
const CUP_ML = 236.59;
const FLOZ_ML = 29.57;
const PINT_ML = 473.18;
const QUART_ML = 946.35;
const GALLON_ML = 3785.41;
const OZ_G = 28.35;
const LB_G = 453.59;

// id stays a short slug (so `toBe("cup")` assertions read clearly); name is the
// real units-table name the engine classifies on.
const TSP = unit("tsp", "teaspoon", "volume", "imperial", TSP_ML);
const TBSP = unit("tbsp", "tablespoon", "volume", "imperial", TBSP_ML);
const CUP = unit("cup", "cup", "volume", "imperial", CUP_ML);
const FLOZ = unit("floz", "fluid ounce", "volume", "imperial", FLOZ_ML);
const PINT = unit("pint", "pint", "volume", "imperial", PINT_ML);
const QUART = unit("quart", "quart", "volume", "imperial", QUART_ML);
const GALLON = unit("gallon", "gallon", "volume", "imperial", GALLON_ML);
const ML = unit("ml", "milliliter", "volume", "metric", 1);
const OZ = unit("oz", "ounce", "weight", "imperial", OZ_G);
const POUND = unit("lb", "pound", "weight", "imperial", LB_G);
const GRAM = unit("g", "gram", "weight", "metric", 1);
const COUNT = unit("count", "count", "count", "universal", null);
const CLOVE = unit("clove", "clove", "count", "universal", null);
const PINCH = unit("pinch", "pinch", "volume", "imperial", null);

const UNITS: UnitInfo[] = [
  TSP, TBSP, CUP, FLOZ, PINT, QUART, GALLON, ML, OZ, POUND, GRAM, COUNT, CLOVE, PINCH,
];

function unit(
  id: string,
  name: string,
  type: string,
  system: string,
  baseConversionFactor: number | null
): UnitInfo {
  return { id, name, type, system, baseConversionFactor };
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
  // Picks the unit a home cook actually reaches for. The ladder is:
  //   tsp (< 1 Tb) -> Tb (< 1/4 cup) -> cup (< 1 qt) -> quart (< 1 gal) -> gallon.
  // fl oz and pint sit OFF the ladder (see "source-only units"). The function
  // returns only the unit id; the displayed quantity is asserted in the
  // aggregateGroceryItems tests. "≈" comments show the number a cook would read.

  describe("standard volume ladder (no source unit)", () => {
    it("keeps small amounts in teaspoons", () => {
      expect(findBestUnitForQuantity(0.25 * TSP_ML, "volume", UNITS)).toBe("tsp"); // 1/4 tsp
      expect(findBestUnitForQuantity(2.5 * TSP_ML, "volume", UNITS)).toBe("tsp"); // 2.5 tsp
    });

    it("uses tablespoons from 1 Tb up to (not including) 1/4 cup", () => {
      expect(findBestUnitForQuantity(3 * TSP_ML, "volume", UNITS)).toBe("tbsp"); // 3 tsp = 1 Tb
      expect(findBestUnitForQuantity(1 * TBSP_ML, "volume", UNITS)).toBe("tbsp");
      expect(findBestUnitForQuantity(3 * TBSP_ML, "volume", UNITS)).toBe("tbsp");
      expect(findBestUnitForQuantity(3.5 * TBSP_ML, "volume", UNITS)).toBe("tbsp"); // still < 1/4 cup
    });

    it("switches to cups at 1/4 cup (a quarter-cup is in the drawer, 4 Tb is not)", () => {
      expect(findBestUnitForQuantity(4 * TBSP_ML, "volume", UNITS)).toBe("cup"); // ≈ 0.25 cup
      expect(findBestUnitForQuantity(CUP_ML / 3, "volume", UNITS)).toBe("cup"); // ≈ 0.33 cup
      expect(findBestUnitForQuantity(8 * TBSP_ML, "volume", UNITS)).toBe("cup"); // ≈ 0.5 cup
      expect(findBestUnitForQuantity(0.75 * CUP_ML, "volume", UNITS)).toBe("cup");
      expect(findBestUnitForQuantity(1.25 * CUP_ML, "volume", UNITS)).toBe("cup");
      expect(findBestUnitForQuantity(3 * CUP_ML, "volume", UNITS)).toBe("cup");
    });

    it("switches to quarts at 1 quart and gallons at 1 gallon", () => {
      expect(findBestUnitForQuantity(4 * CUP_ML, "volume", UNITS)).toBe("quart"); // ≈ 1 qt
      expect(findBestUnitForQuantity(6 * CUP_ML, "volume", UNITS)).toBe("quart"); // ≈ 1.5 qt
      expect(findBestUnitForQuantity(8 * CUP_ML, "volume", UNITS)).toBe("quart"); // ≈ 2 qt
      expect(findBestUnitForQuantity(3.5 * QUART_ML, "volume", UNITS)).toBe("quart");
      expect(findBestUnitForQuantity(16 * CUP_ML, "volume", UNITS)).toBe("gallon"); // ≈ 1 gal
      expect(findBestUnitForQuantity(2.5 * GALLON_ML, "volume", UNITS)).toBe("gallon");
    });
  });

  describe("source-only units (fl oz, pint)", () => {
    it("keeps fl oz when the recipe used it, from 1 fl oz up to (not including) 1 cup", () => {
      expect(findBestUnitForQuantity(1 * FLOZ_ML, "volume", UNITS, "imperial", ["floz"])).toBe("floz");
      expect(findBestUnitForQuantity(6 * FLOZ_ML, "volume", UNITS, "imperial", ["floz"])).toBe("floz");
    });

    it("upgrades fl oz to cups once it reaches 1 cup (8 fl oz)", () => {
      // 10 fl oz ≈ 1.25 cup — "1.25 cup" reads better than "10 fl oz"
      expect(findBestUnitForQuantity(10 * FLOZ_ML, "volume", UNITS, "imperial", ["floz"])).toBe("cup");
    });

    it("falls back to the ladder when below 1 fl oz", () => {
      // 0.8 fl oz — under a whole fl oz, so the standard ladder takes over (Tb here)
      expect(findBestUnitForQuantity(0.8 * FLOZ_ML, "volume", UNITS, "imperial", ["floz"])).toBe("tbsp");
    });

    it("never auto-selects fl oz when the recipe did not use it", () => {
      const base = 0.75 * CUP_ML; // 6 fl oz worth, but written in cups / unknown
      expect(findBestUnitForQuantity(base, "volume", UNITS)).toBe("cup");
      expect(findBestUnitForQuantity(base, "volume", UNITS, "imperial", ["cup"])).toBe("cup");
    });

    it("prefers the ladder unit when a recipe mixes cups and fl oz", () => {
      const base = 0.75 * CUP_ML;
      expect(findBestUnitForQuantity(base, "volume", UNITS, "imperial", ["cup", "floz"])).toBe("cup");
    });

    it("keeps pint up to (not including) 1 quart, else upgrades or falls back", () => {
      expect(findBestUnitForQuantity(1 * PINT_ML, "volume", UNITS, "imperial", ["pint"])).toBe("pint");
      expect(findBestUnitForQuantity(1.5 * PINT_ML, "volume", UNITS, "imperial", ["pint"])).toBe("pint");
      expect(findBestUnitForQuantity(3 * PINT_ML, "volume", UNITS, "imperial", ["pint"])).toBe("quart"); // ≈ 1.5 qt
      expect(findBestUnitForQuantity(0.5 * PINT_ML, "volume", UNITS, "imperial", ["pint"])).toBe("cup"); // ≈ 1 cup
    });

    it("never auto-selects pint (2 cups stays cups, not 1 pint)", () => {
      expect(findBestUnitForQuantity(2 * CUP_ML, "volume", UNITS)).toBe("cup");
    });
  });

  describe("weight (oz / lb)", () => {
    it("keeps ounces until 1 lb when the recipe used ounces", () => {
      expect(findBestUnitForQuantity(4 * OZ_G, "weight", UNITS, "imperial", ["oz"])).toBe("oz");
      expect(findBestUnitForQuantity(8 * OZ_G, "weight", UNITS, "imperial", ["oz"])).toBe("oz");
      expect(findBestUnitForQuantity(16 * OZ_G, "weight", UNITS, "imperial", ["oz"])).toBe("lb"); // ≈ 1 lb
      expect(findBestUnitForQuantity(24 * OZ_G, "weight", UNITS, "imperial", ["oz"])).toBe("lb"); // ≈ 1.5 lb
    });

    it("prefers pounds at 1/4 lb when the recipe did not use ounces", () => {
      expect(findBestUnitForQuantity(4 * OZ_G, "weight", UNITS, "imperial", ["lb"])).toBe("lb"); // ≈ 0.25 lb
      expect(findBestUnitForQuantity(8 * OZ_G, "weight", UNITS)).toBe("lb"); // ≈ 0.5 lb
      expect(findBestUnitForQuantity(1.5 * LB_G, "weight", UNITS, "imperial", ["lb"])).toBe("lb");
    });

    it("uses ounces below 1/4 lb regardless of source", () => {
      expect(findBestUnitForQuantity(2 * OZ_G, "weight", UNITS)).toBe("oz"); // ≈ 2 oz
    });

    it("displays a metric (gram) recipe in imperial, pounds at 1/4 lb", () => {
      // 250 g ≈ 0.55 lb; grams are filtered out (metric), oz is not a source
      expect(findBestUnitForQuantity(250, "weight", UNITS, "imperial", ["g"])).toBe("lb");
    });
  });

  describe("system filter and extremes", () => {
    it("ignores metric units when imperial is preferred", () => {
      // 5 ml would read as "5 ml" but the system filter excludes it → ~1 tsp
      expect(findBestUnitForQuantity(5, "volume", UNITS)).toBe("tsp");
    });

    it("picks the largest unit for an enormous total", () => {
      expect(findBestUnitForQuantity(1_000_000, "volume", UNITS)).toBe("gallon");
    });

    it("picks the smallest unit for a microscopic total", () => {
      expect(findBestUnitForQuantity(0.1, "volume", UNITS)).toBe("tsp");
    });

    it("returns null when no unit of the type/system exists", () => {
      expect(findBestUnitForQuantity(100, "count", UNITS)).toBe(null);
    });
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
    // 1 cup * (8/4) = 2 cups. Kept under a quart so this stays a pure scaling
    // check (4+ cups would read as quarts under the human-readable ladder).
    const items = aggregateGroceryItems(
      [recipe("r1", 8, 4, [ing(1, 1, "cup")])],
      UNITS
    );
    expect(items[0].quantity).toBe(2);
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
    // 1/3 cup scaled by 1: 78.86 ml stays a cup (0.3333… → 0.33)
    const items = aggregateGroceryItems(
      [recipe("r1", 1, 3, [ing(1, 1, "cup")])],
      UNITS
    );
    expect(items[0].unit_id).toBe("cup");
    expect(items[0].quantity).toBe(0.33);
  });

  // --- Human-readable unit selection, exercised end to end ---

  it("preserves a fl-oz recipe's unit end to end", () => {
    const items = aggregateGroceryItems(
      [recipe("r1", 1, 1, [ing(1, 6, "floz")])],
      UNITS
    );
    expect(items[0].unit_id).toBe("floz");
    expect(items[0].quantity).toBe(6);
  });

  it("upgrades a fl-oz recipe to cups once it reaches 1 cup", () => {
    const items = aggregateGroceryItems(
      [recipe("r1", 1, 1, [ing(1, 10, "floz")])], // ≈ 1.25 cup
      UNITS
    );
    expect(items[0].unit_id).toBe("cup");
    expect(items[0].quantity).toBe(1.25);
  });

  it("keeps ounces for an oz recipe but prefers pounds for a non-oz one", () => {
    const ozItems = aggregateGroceryItems(
      [recipe("r1", 1, 1, [ing(1, 8, "oz")])],
      UNITS
    );
    expect(ozItems[0].unit_id).toBe("oz");
    expect(ozItems[0].quantity).toBe(8);

    // Same 226.8 g total written in grams (metric, non-oz source) → 0.5 lb
    const gramItems = aggregateGroceryItems(
      [recipe("r1", 1, 1, [ing(1, 226.8, "g")])],
      UNITS
    );
    expect(gramItems[0].unit_id).toBe("lb");
    expect(gramItems[0].quantity).toBe(0.5);
  });

  it("turns 4 Tbsp into a quarter cup (headline case)", () => {
    const items = aggregateGroceryItems(
      [recipe("r1", 1, 1, [ing(1, 4, "tbsp")])],
      UNITS
    );
    expect(items[0].unit_id).toBe("cup");
    expect(items[0].quantity).toBe(0.25);
  });

  it("uses the ladder unit when one ingredient mixes cups and fl oz", () => {
    // 1 cup + 6 fl oz = 1.75 cup
    const items = aggregateGroceryItems(
      [
        recipe("r1", 1, 1, [ing(1, 1, "cup")]),
        recipe("r2", 1, 1, [ing(1, 6, "floz")]),
      ],
      UNITS
    );
    expect(items).toHaveLength(1);
    expect(items[0].unit_id).toBe("cup");
    expect(items[0].quantity).toBe(1.75);
  });
});
