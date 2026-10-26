import { data } from "react-router";
import type { Route } from "./+types/api.recipes";
import { getServerClient } from "@/lib/supabase.server";
import {
  deleteRecipe,
  updateRecipe,
  validateRecipeBody,
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
    const payload = validateRecipeBody(body);
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
