import { data } from "react-router";
import type { Route } from "./+types/api.recipes";
import { getServerClient } from "@/lib/supabase.server";
import {
  deleteRecipe,
  updateRecipe,
  type UpdateRecipePayload,
} from "@/server/recipes.server";
import { createSupabaseAdminClient } from "@/server/supabase-admin.server";

/**
 * DELETE /api/recipes/:recipeId — delete the recipe row (RLS-checked) and its
 * Storage photo.
 *
 * PUT /api/recipes/:recipeId — update the recipe and replace its ingredients
 * atomically (replace_recipe RPC), then regenerate any grocery lists that
 * reference it. The browser uploads a new photo client-side and passes the
 * final image_url here, so this only handles the row writes + propagation.
 */
export async function action({ request, params }: Route.ActionArgs) {
  const { supabase, headers } = getServerClient(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw data({ message: "Unauthorized" }, { status: 401, headers });
  }

  if (request.method === "DELETE") {
    try {
      await deleteRecipe(supabase, createSupabaseAdminClient(), params.recipeId);
    } catch (error) {
      if (error instanceof Error && error.message === "Recipe not found") {
        throw data({ message: error.message }, { status: 404, headers });
      }
      throw error;
    }
    return data({ ok: true }, { headers });
  }

  if (request.method === "PUT") {
    const body = await request.json().catch(() => null);
    const payload = validateUpdatePayload(body);
    if (!payload) {
      throw data({ message: "Invalid recipe data" }, { status: 400, headers });
    }

    try {
      await updateRecipe(
        supabase,
        createSupabaseAdminClient(),
        params.recipeId,
        payload
      );
    } catch (error) {
      if (error instanceof Error && error.message === "Recipe not found") {
        throw data({ message: error.message }, { status: 404, headers });
      }
      throw error;
    }
    return data({ ok: true }, { headers });
  }

  throw data({ message: "Method not allowed" }, { status: 405, headers });
}

/**
 * Server-side validation — never trust the client. Bounds mirror the DB CHECK
 * constraints exactly: recipes_name_check (length < 100) and
 * recipes_servings_check (servings > 0 AND servings < 300).
 */
function validateUpdatePayload(body: unknown): UpdateRecipePayload | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;

  const name = typeof b.name === "string" ? b.name.trim() : "";
  if (!name || name.length >= 100) return null;

  if (typeof b.servings !== "number" || b.servings <= 0 || b.servings >= 300) {
    return null;
  }

  if (!Array.isArray(b.steps)) return null;
  const steps = b.steps.filter(
    (s): s is string => typeof s === "string" && s.trim().length > 0
  );
  if (steps.length === 0) return null;

  if (!Array.isArray(b.ingredients) || b.ingredients.length === 0) return null;
  const ingredients: UpdateRecipePayload["ingredients"] = [];
  for (const raw of b.ingredients) {
    if (!raw || typeof raw !== "object") return null;
    const ing = raw as Record<string, unknown>;
    if (typeof ing.ingredient_id !== "number") return null;
    if (ing.unit_id != null && typeof ing.unit_id !== "string") return null;
    if (ing.unit_amount != null && typeof ing.unit_amount !== "number") {
      return null;
    }
    ingredients.push({
      ingredient_id: ing.ingredient_id,
      unit_id: (ing.unit_id as string | null) ?? null,
      unit_amount: (ing.unit_amount as number | null) ?? null,
      note: typeof ing.note === "string" && ing.note.trim() ? ing.note.trim() : null,
    });
  }

  const image_url =
    typeof b.image_url === "string" && b.image_url ? b.image_url : null;

  return { name, steps, servings: b.servings, image_url, ingredients };
}
