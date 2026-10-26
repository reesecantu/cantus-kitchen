import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import { deleteRecipe } from "./recipes.server";

// Minimal chainable stand-in for the PostgREST builder: every chain method
// returns the builder, and awaiting it (or maybeSingle) yields `result()`.
function fakeClient(result: (table: string, op: string) => unknown) {
  const storageRemove = vi.fn(async () => ({ error: null }));
  const client = {
    from(table: string) {
      let op = "select";
      const builder = {
        select: () => builder,
        eq: () => builder,
        delete: () => ((op = "delete"), builder),
        maybeSingle: async () => result(table, op),
        then: (resolve: (v: unknown) => unknown) =>
          Promise.resolve(result(table, op)).then(resolve),
      };
      return builder;
    },
    storage: { from: () => ({ remove: storageRemove }) },
  };
  return { client: client as unknown as SupabaseClient, storageRemove };
}

describe("deleteRecipe", () => {
  it("throws 'Recipe not found' when RLS deletes zero rows, before any side effects", async () => {
    const user = fakeClient((_table, op) =>
      op === "delete"
        ? { data: [], error: null }
        : {
            data: { id: "r1", image_url: "https://x/recipe-photos/a.jpg" },
            error: null,
          }
    );
    const admin = fakeClient(() => ({
      data: [{ grocery_list_id: "l1" }],
      error: null,
    }));
    const adminFrom = vi.spyOn(admin.client, "from");

    await expect(deleteRecipe(user.client, admin.client, "r1")).rejects.toThrow(
      "Recipe not found"
    );
    expect(user.storageRemove).not.toHaveBeenCalled();
    // Only the pre-delete list lookup touched the admin client; no regeneration.
    expect(adminFrom).toHaveBeenCalledTimes(1);
    expect(adminFrom).toHaveBeenCalledWith("grocery_list_recipes");
  });
});
