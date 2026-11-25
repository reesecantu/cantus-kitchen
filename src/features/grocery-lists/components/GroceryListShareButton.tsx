import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Check, Copy, Link2 } from "lucide-react";
import { useSetGroceryListSharing } from "../hooks/useGroceryList";
import { ROUTES } from "@/utils/constants";

interface GroceryListShareButtonProps {
  listId: string;
  shareToken: string | null;
}

// Owner-only Share button; its popover holds share, copy, regenerate, stop sharing.
export const GroceryListShareButton = ({
  listId,
  shareToken,
}: GroceryListShareButtonProps) => {
  const sharing = useSetGroceryListSharing();
  const [open, setOpen] = useState(false);
  const [origin, setOrigin] = useState("");
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">(
    "idle",
  );
  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  // Bumped on close and on each share change, so a clipboard write that finishes after either is ignored.
  const session = useRef(0);
  const copyTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const id = useId();

  // window only exists in the browser, so read the origin after mount.
  useEffect(() => setOrigin(window.location.origin), []);
  useEffect(() => () => clearTimeout(copyTimer.current), []);

  // A mutation error stays visible until the next action (mutate() clears it), even across close/reopen.
  const { isPending } = sharing;
  const close = useCallback((returnFocus = false) => {
    session.current++;
    setOpen(false);
    clearTimeout(copyTimer.current);
    setCopyStatus("idle");
    if (returnFocus) buttonRef.current?.focus();
  }, []);

  // Close on a click that both starts and ends outside: a touch-scroll fires no click,
  // and a drag-select that starts in the link field and ends outside doesn't count.
  useEffect(() => {
    if (!open) return;
    let pressedOutside = false;
    const isOutside = (e: Event) =>
      !wrapperRef.current?.contains(e.target as Node);
    const onPointerDown = (e: PointerEvent) => {
      pressedOutside = isOutside(e);
    };
    const onClick = (e: MouseEvent) => {
      if (pressedOutside && isOutside(e)) close();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("click", onClick);
    };
  }, [open, close]);

  const pendingAction = isPending
    ? sharing.variables?.share
      ? "regenerate"
      : "stop"
    : null;

  // Blank while a change is in flight so a link about to die can't be copied.
  const shareLink =
    shareToken && origin && !isPending
      ? origin + ROUTES.GROCERY_LIST_JOIN(shareToken)
      : "";

  // Buttons stay enabled while pending (disabling would drop keyboard focus out of the popover).
  const setSharing = (share: boolean, confirmMessage?: string) => {
    if (isPending) return;
    if (confirmMessage && !confirm(confirmMessage)) return;
    session.current++; // a copy still in flight is for the link about to change
    clearTimeout(copyTimer.current);
    setCopyStatus("idle");
    sharing.mutate({ listId, share });
  };

  const handleCopy = async () => {
    if (!shareLink) return;
    const started = session.current;
    let status: "copied" | "failed" = "copied";
    try {
      await navigator.clipboard.writeText(shareLink);
    } catch {
      status = "failed";
    }
    if (session.current !== started) return; // closed while the write was in flight
    clearTimeout(copyTimer.current);
    setCopyStatus(status);
    if (status === "copied")
      copyTimer.current = setTimeout(() => setCopyStatus("idle"), 2000);
  };

  return (
    <div
      ref={wrapperRef}
      className="relative"
      // Escape is handled here, not on document, so it only fires with focus in the popover.
      onKeyDown={(e) => {
        if (open && e.key === "Escape") close(true);
      }}
      // Tabbing out closes it; a null relatedTarget doesn't, since a native confirm() also blurs that way.
      onBlur={(e) => {
        if (
          open &&
          e.relatedTarget &&
          !e.currentTarget.contains(e.relatedTarget)
        )
          close();
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        onClick={() => (open ? close(true) : setOpen(true))}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? `${id}-popover` : undefined}
        className="flex items-center gap-1.5 px-3 py-2 text-sm text-blue-600 border border-blue-200 rounded-md hover:bg-blue-50 transition-colors"
      >
        <Link2 className="h-4 w-4" aria-hidden="true" />
        Share
        {shareToken && (
          <span className="ml-0.5 px-1.5 rounded text-xs font-medium bg-green-100 text-green-700">
            Link on
          </span>
        )}
      </button>

      {open && (
        // Opens left-aligned on mobile because the header stacks the buttons at the left edge there.
        <div
          id={`${id}-popover`}
          role="dialog"
          aria-labelledby={`${id}-heading`}
          className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 z-20 w-[min(22rem,calc(100vw-2rem))] p-4 bg-white border border-gray-200 rounded-lg shadow-lg"
        >
          <h2
            id={`${id}-heading`}
            className="text-base font-semibold text-gray-800 mb-1"
          >
            Share this list
          </h2>

          {shareToken ? (
            <>
              <p className="text-sm text-gray-600 mb-3">
                Anyone with this link can add recipes and items and check them
                off.
              </p>
              <div className="flex gap-2">
                <input
                  aria-label="Share link"
                  autoFocus
                  type="text"
                  readOnly
                  value={shareLink}
                  onFocus={(e) => e.target.select()}
                  className="flex-1 min-w-0 px-3 py-2 text-sm border border-gray-300 rounded-md bg-gray-50 text-ellipsis focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  aria-disabled={!shareLink}
                  className="flex items-center justify-center gap-1.5 w-24 shrink-0 px-3 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors aria-disabled:opacity-50 aria-disabled:pointer-events-none"
                >
                  {copyStatus === "copied" ? (
                    <>
                      <Check className="h-4 w-4" aria-hidden="true" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" aria-hidden="true" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <p
                aria-live="polite"
                className="text-xs text-gray-600 mt-1 mb-3 min-h-4"
              >
                {copyStatus === "copied" && "Link copied to clipboard."}
                {copyStatus === "failed" &&
                  "Couldn't copy automatically. Select the link and copy it."}
              </p>
              <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() =>
                    setSharing(
                      true,
                      "Regenerate the link? The current link will stop working for new people.",
                    )
                  }
                  aria-disabled={isPending}
                  className="px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors aria-disabled:opacity-50 aria-disabled:pointer-events-none"
                >
                  {pendingAction === "regenerate"
                    ? "Regenerating..."
                    : "Regenerate link"}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSharing(
                      false,
                      "Stop sharing? The link will stop working. People who already joined keep access.",
                    )
                  }
                  aria-disabled={isPending}
                  className="px-3 py-2 text-sm text-red-600 border border-red-200 rounded-md hover:bg-red-50 transition-colors aria-disabled:opacity-50 aria-disabled:pointer-events-none"
                >
                  {pendingAction === "stop" ? "Stopping..." : "Stop sharing"}
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-3">
                Share a link so others can add recipes and check off items with
                you.
              </p>
              <button
                type="button"
                onClick={() => setSharing(true)}
                aria-disabled={isPending}
                autoFocus
                className="w-full px-3 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors aria-disabled:opacity-50 aria-disabled:pointer-events-none"
              >
                {isPending ? "Creating link..." : "Create share link"}
              </button>
            </>
          )}

          {sharing.error && (
            <p role="alert" className="mt-2 text-sm text-red-600">
              {sharing.error.message}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
