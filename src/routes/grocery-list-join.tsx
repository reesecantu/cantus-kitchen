import { useCallback, useEffect, useRef, useState } from "react";
import { Link, data, redirect, useRevalidator } from "react-router";
import {
  isAuthApiError,
  isAuthSessionMissingError,
} from "@supabase/supabase-js";
import type { Route } from "./+types/grocery-list-join";
import { getServerClient } from "@/lib/supabase.server";
import { useAuth } from "@/features/auth/AuthContext";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ERROR_MESSAGES, ROUTES } from "@/utils/constants";

export function meta() {
  return [
    { title: "Join Grocery List | Cantu's Kitchen" },
    { name: "robots", content: "noindex" },
  ];
}

// Supabase Auth error codes meaning the cookie session can never work again.
// Not refresh_token_already_used: concurrent refreshes can hit it transiently,
// and we must not swap a live real account for a guest.
const DEAD_SESSION_CODES = new Set([
  "user_not_found",
  "bad_jwt",
  "session_expired",
  "refresh_token_not_found",
]);

/**
 * GET /grocery-list/join/:token — join the shared list and redirect to it.
 * Without a session the page signs the visitor in as a guest, which
 * revalidates this loader (AuthContext's SIGNED_IN handler) and joins.
 */
export async function loader({ request, params }: Route.LoaderArgs) {
  const { supabase, headers } = getServerClient(request);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (!user) {
    // No session, or a definitely dead one (e.g. a guest the cron removed):
    // safe to become a guest. Anything else (outage, 429) must not swap a real
    // session for a throwaway guest.
    const noSession =
      !authError ||
      isAuthSessionMissingError(authError) ||
      (isAuthApiError(authError) &&
        DEAD_SESSION_CODES.has(authError.code ?? ""));
    if (!noSession) {
      throw data("Failed to check your session", { status: 500, headers });
    }
    return data({ status: "needs-guest" as const }, { headers });
  }

  const { data: listId, error } = await supabase.rpc("join_grocery_list", {
    p_token: params.token,
  });
  if (error) {
    throw data("Failed to join grocery list", { status: 500, headers });
  }
  if (!listId) {
    return data({ status: "invalid" as const }, { headers });
  }
  return redirect(ROUTES.GROCERY_LIST_DETAILS(listId), { headers });
}

export default function GroceryListJoinRoute({
  loaderData,
}: Route.ComponentProps) {
  const { isReady, signInAnonymously } = useAuth();
  const revalidator = useRevalidator();
  const attempted = useRef(false);
  const [phase, setPhase] = useState<
    "waiting" | "signing-in" | "signed-in" | "failed"
  >("waiting");
  const needsGuest = loaderData.status === "needs-guest";

  const signInAsGuest = useCallback(async () => {
    setPhase("signing-in");
    try {
      // On success AuthContext's SIGNED_IN handler revalidates this loader.
      await signInAnonymously();
      setPhase("signed-in");
    } catch {
      setPhase("failed");
    }
  }, [signInAnonymously]);

  useEffect(() => {
    // The loader says needs-guest only when the server sees no session or a
    // dead one, so any session the client still holds is stale and safe to
    // replace. Wait for isReady (a legacy localStorage session is restored by
    // then, and its SIGNED_IN revalidation makes the revalidator busy). Ref
    // guard: StrictMode runs effects twice; one guest per visit.
    if (!needsGuest || !isReady || revalidator.state !== "idle") return;
    if (attempted.current) return;
    attempted.current = true;
    signInAsGuest();
  }, [needsGuest, isReady, revalidator.state, signInAsGuest]);

  if (!needsGuest) {
    return (
      <main className="max-w-md mx-auto flex flex-col items-center gap-4 px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-800">
          Link no longer valid
        </h1>
        <p className="text-gray-600">
          {ERROR_MESSAGES.GROCERY_LISTS.SHARE_LINK_INVALID}
        </p>
        <Link
          to={ROUTES.GROCERY_LISTS}
          className="rounded-lg bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
        >
          Go to my grocery lists
        </Link>
      </main>
    );
  }

  // Still in flight: waiting for auth, signing in, or the post-sign-in
  // revalidation. Otherwise the join didn't happen; offer a retry instead of
  // spinning forever.
  const pending =
    phase === "waiting" ||
    phase === "signing-in" ||
    revalidator.state !== "idle";

  return (
    <main className="max-w-md mx-auto flex flex-col items-center gap-4 px-4 py-16 text-center">
      {pending ? (
        <LoadingSpinner size="lg" text="Joining grocery list..." center />
      ) : (
        <>
          <p className="text-gray-600">
            {phase === "failed"
              ? ERROR_MESSAGES.AUTH.GUEST_SIGNIN_FAILED
              : "We couldn't join this grocery list."}
          </p>
          <button
            type="button"
            // Already a fresh guest: only the join needs retrying, and another
            // sign-in would orphan this guest.
            onClick={() =>
              phase === "signed-in" ? revalidator.revalidate() : signInAsGuest()
            }
            className="rounded-lg bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
          >
            Try again
          </button>
        </>
      )}
    </main>
  );
}
