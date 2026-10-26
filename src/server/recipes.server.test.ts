import { describe, expect, it } from "vitest";
import { validateRecipeBody } from "./recipes.server";

const ingredient = { ingredient_id: 1, unit_id: "cup", unit_amount: 2, position: 0 };
const valid = {
  name: "Pancakes",
  servings: 4,
  steps: ["Mix", "Cook"],
  image_url: null,
  ingredients: [ingredient, { ingredient_id: 2, unit_amount: null }],
};

function withIngredient(overrides: Record<string, unknown>) {
  return { ...valid, ingredients: [{ ...ingredient, ...overrides }] };
}

describe("validateRecipeBody", () => {
  it("accepts a valid body, keeping null amounts as 'to taste'", () => {
    const payload = validateRecipeBody(valid);
    expect(payload?.servings).toBe(4);
    expect(payload?.ingredients[1]).toMatchObject({ unit_amount: null, position: 1 });
  });

  it.each([
    ["fractional servings", { ...valid, servings: 2.5 }],
    ["blank name", { ...valid, name: "   " }],
    ["empty ingredients", { ...valid, ingredients: [] }],
    ["fractional ingredient_id", withIngredient({ ingredient_id: 1.5 })],
    ["fractional position", withIngredient({ position: 1.5 })],
    ["negative unit_amount", withIngredient({ unit_amount: -2 })],
    ["zero unit_amount", withIngredient({ unit_amount: 0 })],
  ])("rejects %s", (_label, body) => {
    expect(validateRecipeBody(body)).toBeNull();
  });
});
