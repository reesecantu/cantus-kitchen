import { data } from "react-router";
import type { Route } from "./+types/api.recipes.create";
import { getServerClient } from "@/lib/supabase.server";
import {
  createRecipe,
  validateRecipeBody,
} from "@/server/recipes.server";

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
  const payload = validateRecipeBody(body);
  if (!payload) {
    throw data({ message: "Invalid recipe data" }, { status: 400, headers });
  }

  const recipeId = await createRecipe(supabase, {
    ...payload,
    created_by: user.id,
  });
  return data({ id: recipeId }, { status: 201, headers });
}
