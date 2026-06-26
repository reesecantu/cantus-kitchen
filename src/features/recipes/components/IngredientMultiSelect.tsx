import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Plus, X } from "lucide-react";
import type { Tables } from "@/types/database-types";
import type { RecipeIngredient } from "@/features/recipes/types";
import { useUnits } from "@/hooks/useUnits";
import { SearchableDropdown } from "@/components/SearchableDropdown";
import { COLORS } from "@/utils/constants";

interface IngredientMultiSelectProps {
  ingredients: Tables<"ingredients">[];
  selectedIngredients: RecipeIngredient[];
  onIngredientsChange: (ingredients: RecipeIngredient[]) => void;
  isLoading?: boolean;
  isError?: boolean;
}

/** Display section derived from a contiguous run of rows sharing a group_label. */
interface Section {
  /** First row's stable rowId — survives label edits, so the section subtree
   *  (and its group-name input) isn't remounted on every keystroke. */
  key: string;
  /** "" = the ungrouped run (rendered without a header). */
  label: string;
  rows: RecipeIngredient[];
}

const labelOf = (row: RecipeIngredient) => row.group_label ?? "";

/**
 * Group the flat ordered ingredient array into contiguous runs of equal
 * group_label. Array order is the source of truth; this is purely for display.
 */
function buildSections(rows: RecipeIngredient[]): Section[] {
  const sections: Section[] = [];
  for (const row of rows) {
    const label = labelOf(row);
    const last = sections[sections.length - 1];
    if (last && last.label === label) {
      last.rows.push(row);
    } else {
      sections.push({ key: row.rowId, label, rows: [row] });
    }
  }
  return sections;
}

export const IngredientMultiSelect = ({
  ingredients,
  selectedIngredients,
  onIngredientsChange,
  isLoading = false,
  isError = false,
}: IngredientMultiSelectProps) => {
  const { data: units = [] } = useUnits();

  // Empty groups the user has created but not yet filled. They can't live in
  // the flat array (no rows = no representation), so they're held here until
  // the first ingredient is added, then dropped. Client-only, never persisted.
  const [pendingGroups, setPendingGroups] = useState<
    { id: string; name: string }[]
  >([]);

  const sections = useMemo(
    () => buildSections(selectedIngredients),
    [selectedIngredients]
  );

  const indexByRowId = useMemo(() => {
    const map = new Map<string, number>();
    selectedIngredients.forEach((row, i) => map.set(row.rowId, i));
    return map;
  }, [selectedIngredients]);

  const makeRow = (
    ingredient: Tables<"ingredients">,
    groupLabel: string
  ): RecipeIngredient => {
    const defaultUnit = units[0];
    return {
      rowId: crypto.randomUUID(),
      ingredient_id: ingredient.id,
      ingredient_name: ingredient.name,
      unit_id: defaultUnit?.id || null,
      unit_name: defaultUnit?.name || "",
      unit_amount: undefined,
      note: "",
      group_label: groupLabel || null,
    };
  };

  /** Append a new ingredient row at the end of the run that shares `label`. */
  const addIngredient = (
    ingredient: Tables<"ingredients">,
    label: string,
    pendingId?: string
  ) => {
    const newRow = makeRow(ingredient, label);
    const arr = [...selectedIngredients];
    let insertAt = arr.length;
    for (let i = arr.length - 1; i >= 0; i--) {
      if (labelOf(arr[i]) === label) {
        insertAt = i + 1;
        break;
      }
    }
    arr.splice(insertAt, 0, newRow);
    onIngredientsChange(arr);
    // The group now has a row in the array — it's no longer pending.
    if (pendingId) {
      setPendingGroups((pg) => pg.filter((g) => g.id !== pendingId));
    }
  };

  const removeIngredient = (rowId: string) => {
    onIngredientsChange(selectedIngredients.filter((r) => r.rowId !== rowId));
  };

  const updateIngredient = (
    rowId: string,
    updates: Partial<RecipeIngredient>
  ) => {
    onIngredientsChange(
      selectedIngredients.map((r) =>
        r.rowId === rowId ? { ...r, ...updates } : r
      )
    );
  };

  const updateIngredientUnit = (rowId: string, unitId: string | null) => {
    const selectedUnit = units.find((unit) => unit.id === unitId);
    updateIngredient(rowId, {
      unit_id: unitId,
      unit_name: selectedUnit?.name || "",
    });
  };

  /**
   * Move a row up/down by swapping with its array neighbor; the moved row
   * adopts the neighbor's group_label. Within a group this is a plain reorder;
   * across a group boundary it moves the row into the adjacent group.
   */
  const moveIngredient = (rowId: string, dir: "up" | "down") => {
    const i = indexByRowId.get(rowId);
    if (i === undefined) return;
    const j = dir === "up" ? i - 1 : i + 1;
    if (j < 0 || j >= selectedIngredients.length) return;
    const arr = [...selectedIngredients];
    const neighborLabel = arr[j].group_label ?? null;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    arr[j] = { ...arr[j], group_label: neighborLabel };
    onIngredientsChange(arr);
  };

  /** Reorder a whole group (contiguous run) among the rendered sections. */
  const moveSection = (sectionIndex: number, dir: "up" | "down") => {
    const j = dir === "up" ? sectionIndex - 1 : sectionIndex + 1;
    if (j < 0 || j >= sections.length) return;
    const reordered = [...sections];
    [reordered[sectionIndex], reordered[j]] = [
      reordered[j],
      reordered[sectionIndex],
    ];
    onIngredientsChange(reordered.flatMap((s) => s.rows));
  };

  const renameSection = (rowIds: Set<string>, newName: string) => {
    onIngredientsChange(
      selectedIngredients.map((r) =>
        rowIds.has(r.rowId) ? { ...r, group_label: newName || null } : r
      )
    );
  };

  const deleteSection = (rowIds: Set<string>) => {
    onIngredientsChange(
      selectedIngredients.filter((r) => !rowIds.has(r.rowId))
    );
  };

  const addGroup = () => {
    setPendingGroups((pg) => [...pg, { id: crypto.randomUUID(), name: "" }]);
  };

  const renamePendingGroup = (id: string, name: string) => {
    setPendingGroups((pg) =>
      pg.map((g) => (g.id === id ? { ...g, name } : g))
    );
  };

  const removePendingGroup = (id: string) => {
    setPendingGroups((pg) => pg.filter((g) => g.id !== id));
  };

  const totalCount = selectedIngredients.length;

  // Ingredients already in the ungrouped run — excluded from the main dropdown
  // so the same ingredient can't be added twice to the same section.
  const ungroupedIds = useMemo(() => {
    const set = new Set<number>();
    for (const r of selectedIngredients) {
      if (labelOf(r) === "") set.add(r.ingredient_id);
    }
    return set;
  }, [selectedIngredients]);

  const renderIngredientRow = (row: RecipeIngredient) => {
    const index = indexByRowId.get(row.rowId) ?? 0;
    const canUp = index > 0;
    const canDown = index < totalCount - 1;
    return (
      <div
        key={row.rowId}
        className="p-2 bg-white rounded-lg border border-gray-300 shadow-sm"
      >
        <div className="flex-1 min-w-0 mb-2">
          <span className="font-medium text-sm text-gray-900">
            {row.ingredient_name}
          </span>
        </div>
        <div className="flex items-end gap-2">
          <div className="grid grid-cols-12 gap-3 items-end flex-1">
            <div className="col-span-3">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Amount
              </label>
              <input
                type="number"
                inputMode="decimal"
                value={row.unit_amount?.toString() || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  updateIngredient(row.rowId, {
                    unit_amount:
                      value === "" ? undefined : parseFloat(value) || undefined,
                  });
                }}
                onBlur={(e) => {
                  const value = e.target.value;
                  if (value !== "") {
                    const num = parseFloat(value);
                    if (isNaN(num) || num <= 0) {
                      updateIngredient(row.rowId, { unit_amount: undefined });
                    }
                  }
                }}
                className="w-full px-2 py-1 h-8 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>

            <div className="col-span-3">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Unit
              </label>
              <select
                value={row.unit_id || ""}
                onChange={(e) =>
                  updateIngredientUnit(row.rowId, e.target.value || null)
                }
                className="w-full px-2 py-1 h-8 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.abbreviation
                      ? `${unit.name} (${unit.abbreviation})`
                      : unit.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-6">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Notes
              </label>
              <input
                type="text"
                placeholder="e.g., 'diced', 'finely chopped'"
                value={row.note || ""}
                onChange={(e) =>
                  updateIngredient(row.rowId, { note: e.target.value })
                }
                className="w-full px-3 py-1 h-8 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Move / delete controls */}
          <div className="flex flex-col items-center flex-shrink-0">
            <button
              type="button"
              onClick={() => moveIngredient(row.rowId, "up")}
              disabled={!canUp}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed p-0.5"
              title="Move up"
            >
              <ChevronUp className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => moveIngredient(row.rowId, "down")}
              disabled={!canDown}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed p-0.5"
              title="Move down"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => removeIngredient(row.rowId)}
              className="text-red-500 hover:text-red-700 p-0.5"
              title="Remove ingredient"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  /** Add-ingredient dropdown scoped to a group; excludes dupes already in it. */
  const renderAddDropdown = (
    label: string,
    excludeIds: Set<number>,
    placeholderLabel: string,
    pendingId?: string,
    disabled?: boolean
  ) => {
    const available = ingredients.filter((ing) => !excludeIds.has(ing.id));
    return (
      <SearchableDropdown
        label={placeholderLabel}
        placeholder={isLoading ? "Loading ingredients..." : "Add ingredient..."}
        searchPlaceholder="Search ingredients..."
        items={available}
        onItemSelect={(ing) => addIngredient(ing, label, pendingId)}
        getItemId={(ing) => ing.id}
        getItemLabel={(ing) => ing.name}
        mode="single"
        disabled={isLoading || disabled}
      />
    );
  };

  return (
    <div className="space-y-4">
      {totalCount > 0 && (
        <label className="block text-sm font-medium text-gray-700">
          Ingredients ({totalCount})
        </label>
      )}

      {/* Sections in array order; ungrouped runs render without a header. */}
      {sections.map((section, sectionIndex) => {
        const rowIds = new Set(section.rows.map((r) => r.rowId));
        const sectionIngredientIds = new Set(
          section.rows.map((r) => r.ingredient_id)
        );

        if (section.label === "") {
          return (
            <div key={section.key} className="space-y-2">
              {section.rows.map(renderIngredientRow)}
            </div>
          );
        }

        return (
          <div
            key={section.key}
            className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3"
          >
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={section.label}
                onChange={(e) => renameSection(rowIds, e.target.value)}
                placeholder="Group name"
                className="flex-1 px-2 py-1 h-8 border border-gray-300 rounded text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => moveSection(sectionIndex, "up")}
                disabled={sectionIndex === 0}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed p-1"
                title="Move group up"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => moveSection(sectionIndex, "down")}
                disabled={sectionIndex === sections.length - 1}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed p-1"
                title="Move group down"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => deleteSection(rowIds)}
                className="text-red-500 hover:text-red-700 p-1"
                title="Delete group and its ingredients"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {section.rows.map(renderIngredientRow)}

            {renderAddDropdown(
              section.label,
              sectionIngredientIds,
              "Add to this group"
            )}
          </div>
        );
      })}

      {/* Empty groups awaiting their first ingredient. */}
      {pendingGroups.map((group) => (
        <div
          key={group.id}
          className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3"
        >
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={group.name}
              onChange={(e) => renamePendingGroup(group.id, e.target.value)}
              placeholder="Group name"
              className="flex-1 px-2 py-1 h-8 border border-gray-300 rounded text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => removePendingGroup(group.id)}
              className="text-red-500 hover:text-red-700 p-1"
              title="Remove group"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {group.name.trim() ? (
            renderAddDropdown(
              group.name,
              new Set<number>(),
              "Add to this group",
              group.id
            )
          ) : (
            <p className="text-xs text-gray-500 italic">
              Name this group to start adding ingredients.
            </p>
          )}
        </div>
      ))}

      {/* Add ungrouped ingredient + create a new group */}
      {isError ? (
        <p className="text-sm text-red-600">
          Failed to load ingredients. Please refresh.
        </p>
      ) : (
        <div className="space-y-3">
          {renderAddDropdown(
            "",
            ungroupedIds,
            totalCount === 0 ? "Ingredients" : "Add ingredient"
          )}
          <button
            type="button"
            onClick={addGroup}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            <Plus className="h-4 w-4" /> Add a group
          </button>
        </div>
      )}

      <p className={`text-xs ${COLORS.TEXT_SECONDARY}`}>
        Can't find an ingredient you want?{" "}
        <a
          href="https://forms.gle/c8ydhgk7qibz9yWw6"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline decoration-blue-500 decoration-2 font-medium"
        >
          Request a new one here!
        </a>
      </p>
    </div>
  );
};
