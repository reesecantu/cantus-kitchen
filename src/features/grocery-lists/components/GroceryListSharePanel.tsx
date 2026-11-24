import { useEffect, useState } from "react";
import { Check, Copy, Link2 } from "lucide-react";
import { useSetGroceryListSharing } from "../hooks/useGroceryList";
import { ROUTES } from "@/utils/constants";

interface GroceryListSharePanelProps {
  listId: string;
  shareToken: string | null;
}

// Owner-only controls: share, copy link, regenerate, stop sharing.
export const GroceryListSharePanel = ({
  listId,
  shareToken,
}: GroceryListSharePanelProps) => {
  const sharing = useSetGroceryListSharing();
  const [origin, setOrigin] = useState("");
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">(
    "idle",
  );

  // window only exists in the browser, so read the origin after mount.
  useEffect(() => setOrigin(window.location.origin), []);
  // Blank while a change is in flight so a link about to die can't be copied.
  const shareLink =
    shareToken && origin && !sharing.isPending
      ? origin + ROUTES.GROCERY_LIST_JOIN(shareToken)
      : "";

  const setSharing = (share: boolean, confirmMessage?: string) => {
    if (confirmMessage && !confirm(confirmMessage)) return;
    setCopyStatus("idle");
    sharing.mutate({ listId, share });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopyStatus("copied");
      setTimeout(() => setCopyStatus("idle"), 2000);
    } catch {
      setCopyStatus("failed");
    }
  };

  return (
    <section
      aria-labelledby="share-list-heading"
      className="mb-8 p-4 bg-gray-50 rounded-lg"
    >
      <h2
        id="share-list-heading"
        className="flex items-center gap-2 text-lg font-semibold text-gray-800 mb-2"
      >
        <Link2 className="h-5 w-5" aria-hidden="true" />
        Share
      </h2>

      {shareToken ? (
        <>
          <p className="text-sm text-gray-600 mb-3">
            Anyone with this link can add recipes and items and check them off.
          </p>
          <div className="flex gap-2 mb-1">
            <label htmlFor="share-list-link" className="sr-only">
              Share link
            </label>
            <input
              id="share-list-link"
              type="text"
              readOnly
              value={shareLink}
              onFocus={(e) => e.target.select()}
              className="flex-1 min-w-0 px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={handleCopy}
              disabled={!shareLink}
              className="flex items-center gap-1.5 px-3 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {copyStatus === "copied" ? (
                <Check className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Copy className="h-4 w-4" aria-hidden="true" />
              )}
              {copyStatus === "copied" ? "Copied" : "Copy"}
            </button>
          </div>
          <p aria-live="polite" className="text-sm text-gray-600 mb-3 min-h-5">
            {copyStatus === "copied" && "Link copied to clipboard."}
            {copyStatus === "failed" &&
              "Couldn't copy automatically. Select the link and copy it."}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                setSharing(
                  true,
                  "Regenerate the link? The current link will stop working for new people.",
                )
              }
              disabled={sharing.isPending}
              className="px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Regenerate link
            </button>
            <button
              type="button"
              onClick={() =>
                setSharing(
                  false,
                  "Stop sharing? The link will stop working. People who already joined keep access.",
                )
              }
              disabled={sharing.isPending}
              className="px-3 py-2 text-sm text-red-600 border border-red-200 rounded-md hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Stop sharing
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-gray-600 mb-3">
            Share a link so others can add recipes and check off items with you.
          </p>
          <button
            type="button"
            onClick={() => setSharing(true)}
            disabled={sharing.isPending}
            className="px-3 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sharing.isPending ? "Creating link..." : "Share list"}
          </button>
        </>
      )}

      {sharing.error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {sharing.error.message}
        </p>
      )}
    </section>
  );
};
