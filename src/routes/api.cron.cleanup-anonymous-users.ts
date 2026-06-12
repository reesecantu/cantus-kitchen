import { data } from "react-router";
import type { Route } from "./+types/api.cron.cleanup-anonymous-users";
import { createSupabaseAdminClient } from "@/server/supabase-admin.server";

/**
 * GET /api/cron/cleanup-anonymous-users
 *
 * Invoked by Vercel cron (see vercel.json). Vercel sends
 * `Authorization: Bearer ${CRON_SECRET}` automatically when the env var is
 * set. Calls the delete_old_anonymous_users() SQL function, whose public
 * EXECUTE grants were revoked in the phase2_prepare migration.
 */
export async function loader({ request }: Route.LoaderArgs) {
  const authHeader = request.headers.get("Authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    throw data({ message: "Unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  const { data: result, error } = await admin.rpc("delete_old_anonymous_users");
  if (error) {
    console.error("Anonymous user cleanup failed:", error);
    throw data({ message: error.message }, { status: 500 });
  }

  const deletedCount = result?.[0]?.deleted_count ?? 0;
  return data({ deletedCount });
}
