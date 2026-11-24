import { data } from "react-router";
import type { Route } from "./+types/api.grocery-list-share";
import { getServerClient } from "@/lib/supabase.server";
import { getAccessibleList, setShareToken } from "@/server/grocery-lists.server";

/**
 * POST   /api/grocery-lists/:listId/share -> { shareToken }        (share / regenerate)
 * DELETE /api/grocery-lists/:listId/share -> { shareToken: null }  (stop sharing)
 *
 * Owner only: members get 403, anyone else 404. Regenerating replaces the
 * token, so the old link stops joining new members.
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

  // Owners and members can see the list; only the owner manages the link.
  const list = await getAccessibleList(supabase, params.listId);
  if (!list) {
    throw data({ message: "Grocery list not found" }, { status: 404, headers });
  }
  if (list.user_id !== user.id) {
    throw data(
      { message: "Only the list owner can manage sharing" },
      { status: 403, headers }
    );
  }

  const shareToken = request.method === "POST" ? crypto.randomUUID() : null;
  await setShareToken(supabase, params.listId, shareToken);
  return data({ shareToken }, { headers });
}
