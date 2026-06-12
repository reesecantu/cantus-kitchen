import { data } from "react-router";
import type { Route } from "./+types/api.recipes";
import { getServerClient } from "@/lib/supabase.server";
import { deleteRecipe } from "@/server/recipes.server";
import { createSupabaseAdminClient } from "@/server/supabase-admin.server";

/**
 * DELETE /api/recipes/:recipeId
 *
 * Deletes the recipe row (RLS-checked) and its Storage photo — replaces the
 * trg_enqueue_recipe_photo_delete trigger. No UI calls this yet; it lands
 * ready for a future delete button.
 */
export async function action({ request, params }: Route.ActionArgs) {
  const { supabase, headers } = getServerClient(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw data({ message: "Unauthorized" }, { status: 401, headers });
  }

  if (request.method !== "DELETE") {
    throw data({ message: "Method not allowed" }, { status: 405, headers });
  }

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
