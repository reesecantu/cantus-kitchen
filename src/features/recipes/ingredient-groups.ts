import type { RecipeIngredient } from "./types";

/** Display name of a group; null/"" both mean "ungrouped". */
export const labelOf = (row: { group_label?: string | null }): string =>
  row.group_label ?? "";

/** Normalize a user-entered group name for persistence: trimmed, or null. */
export const normalizeGroupLabel = (
  label: string | null | undefined
): string | null => {
  const trimmed = (label ?? "").trim();
  return trimmed ? trimmed : null;
};

/**
 * Split an ordered array into contiguous runs sharing the same key. Array order
 * is the source of truth; this is purely for display grouping. Used by both the
 * editor (keyed by groupId) and the read-only detail view (keyed by label).
 */
export function groupContiguous<T>(rows: T[], keyOf: (row: T) => string): T[][] {
  const runs: T[][] = [];
  let lastKey: string | undefined;
  for (const row of rows) {
    const key = keyOf(row);
    if (runs.length > 0 && lastKey === key) {
      runs[runs.length - 1].push(row);
    } else {
      runs.push([row]);
      lastKey = key;
    }
  }
  return runs;
}

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
