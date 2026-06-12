import { data } from "react-router";
import type { Route } from "./+types/api.grocery-list-items";
import { getServerClient } from "@/lib/supabase.server";
import { addManualItem, ownsList } from "@/server/grocery-lists.server";

/**
 * POST /api/grocery-lists/:listId/items
 *   { ingredientName, quantity, unitName, notes? } -> { id }
 *
 * Replaces the add_manual_item_to_grocery_list RPC.
 */
export async function action({ request, params }: Route.ActionArgs) {
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
  const ingredientName = body?.ingredientName;
  const unitName = body?.unitName;
  // typeof check first: Number(null) and Number("") coerce to 0 and would
  // otherwise slip past as a "valid" quantity
  const quantity = typeof body?.quantity === "number" ? body.quantity : NaN;
  if (
    typeof ingredientName !== "string" ||
    !ingredientName.trim() ||
    typeof unitName !== "string" ||
    !unitName.trim() ||
    !Number.isFinite(quantity) ||
    quantity <= 0
  ) {
    throw data(
      { message: "ingredientName, a positive quantity, and unitName are required" },
      { status: 400, headers }
    );
  }

  if (!(await ownsList(supabase, params.listId))) {
    throw data({ message: "Grocery list not found" }, { status: 404, headers });
  }

  try {
    const id = await addManualItem(supabase, {
      listId: params.listId,
      ingredientName,
      quantity,
      unitName,
      notes: typeof body?.notes === "string" ? body.notes : null,
    });
    return data({ id }, { headers });
  } catch (error) {
    if (error instanceof Error && error.message.includes("not found")) {
      throw data({ message: error.message }, { status: 400, headers });
    }
    throw error;
  }
}
