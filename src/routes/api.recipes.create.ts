import { data } from "react-router";
import type { Route } from "./+types/api.recipes.create";
import { getServerClient } from "@/lib/supabase.server";
import { createRecipe, type CreateRecipePayload } from "@/server/recipes.server";

/** POST /api/recipes — create a recipe and its ingredients atomically. */
export async function action({ request }: Route.ActionArgs) {
  const { supabase, headers } = getServerClient(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw data({ message: "Unauthorized" }, { status: 401, headers });
  }

  if (request.method !== "POST") {
    throw data({ message: "Method not allowed" }, { status: 405, headers });
  }

  const body = await request.json().catch(() => null);
  const payload = validateCreatePayload(body, user.id);
  if (!payload) {
    throw data({ message: "Invalid recipe data" }, { status: 400, headers });
  }

  const recipeId = await createRecipe(supabase, payload);
  return data({ id: recipeId }, { status: 201, headers });
}

function validateCreatePayload(
  body: unknown,
  userId: string
): CreateRecipePayload | null {
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
  const ingredients: CreateRecipePayload["ingredients"] = [];
  for (const [index, raw] of b.ingredients.entries()) {
    if (!raw || typeof raw !== "object") return null;
    const ing = raw as Record<string, unknown>;
    if (typeof ing.ingredient_id !== "number") return null;
    if (ing.unit_id != null && typeof ing.unit_id !== "string") return null;
    if (ing.unit_amount != null && typeof ing.unit_amount !== "number") {
      return null;
    }
    if (ing.group_label != null && typeof ing.group_label !== "string") {
      return null;
    }
    if (ing.position != null && typeof ing.position !== "number") return null;
    ingredients.push({
      ingredient_id: ing.ingredient_id,
      unit_id: (ing.unit_id as string | null) ?? null,
      unit_amount: (ing.unit_amount as number | null) ?? null,
      note: typeof ing.note === "string" && ing.note.trim() ? ing.note.trim() : null,
      group_label:
        typeof ing.group_label === "string" && ing.group_label.trim()
          ? ing.group_label.trim()
          : null,
      // Trust the client's order but fall back to array index defensively.
      position: typeof ing.position === "number" ? ing.position : index,
    });
  }

  const image_url =
    typeof b.image_url === "string" && b.image_url ? b.image_url : null;

  return { name, steps, servings: b.servings, image_url, created_by: userId, ingredients };
}
