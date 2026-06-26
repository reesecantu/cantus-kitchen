import type { RecipeIngredient } from "./types";

/**
 * Reconstruct a stable client-only `groupId` for each row when seeding form
 * state from persisted data (which carries only `group_label`). Rows in the
 * same contiguous run of equal non-empty label share one id; ungrouped rows get
 * `undefined`.
 *
 * The id is derived from the run's first `rowId` (never random), so the result
 * is identical across SSR and hydration — `EditRecipe` seeds form state in a
 * `useState` initializer that runs on the server. An existing `groupId` on the
 * run's first row is preserved, so a draft saved by a newer client round-trips
 * unchanged.
 */
export function seedGroupIds(rows: RecipeIngredient[]): RecipeIngredient[] {
  let runLabel: string | null = null;
  let runGroupId: string | undefined;
  return rows.map((row) => {
    const label = row.group_label ?? "";
    if (label === "") {
      runLabel = null;
      runGroupId = undefined;
      return { ...row, groupId: undefined };
    }
    if (label !== runLabel) {
      runLabel = label;
      runGroupId = row.groupId ?? row.rowId;
    }
    return { ...row, groupId: runGroupId };
  });
}
