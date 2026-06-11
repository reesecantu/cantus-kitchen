import { data } from "react-router";
import type { Route } from "./+types/api.grocery-list-recipes";
import { getServerClient } from "@/lib/supabase.server";
import {
  addRecipeToGroceryList,
  removeRecipeFromGroceryList,
  ownsList,
} from "@/server/grocery-lists.server";

/**
 * POST   /api/grocery-lists/:listId/recipes  { recipeId, servingsMultiplier? }
 * DELETE /api/grocery-lists/:listId/recipes  { recipeId }
 *
 * Replaces the add_recipe_to_grocery_list RPC and the regeneration trigger:
 * both mutations recompute the list's generated items before responding.
 */
export async function action({ request, params }: Route.ActionArgs) {
  const { supabase, headers } = getServerClient(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw data({ message: "Unauthorized" }, { status: 401, headers });
  }

  if (request.method !== "POST" && request.method !== "DELETE") {
    throw data({ message: "Method not allowed" }, { status: 405, headers });
  }

  const body = await request.json().catch(() => null);
  const recipeId = body?.recipeId;
  if (typeof recipeId !== "string" || !recipeId) {
    throw data({ message: "recipeId is required" }, { status: 400, headers });
  }

  if (!(await ownsList(supabase, params.listId))) {
    throw data({ message: "Grocery list not found" }, { status: 404, headers });
  }

  if (request.method === "POST") {
    const servingsMultiplier = Number(body?.servingsMultiplier ?? 1.0);
    if (!Number.isFinite(servingsMultiplier) || servingsMultiplier <= 0) {
      throw data(
        { message: "servingsMultiplier must be a positive number" },
        { status: 400, headers }
      );
    }
    await addRecipeToGroceryList(supabase, {
      listId: params.listId,
      recipeId,
      servingsMultiplier,
    });
  } else {
    await removeRecipeFromGroceryList(supabase, {
      listId: params.listId,
      recipeId,
    });
  }

  return data({ ok: true }, { headers });
}
