import { useGoogleAuth } from "../../hooks/auth/useGoogleAuth";
import { LoadingSpinner } from "./LoadingSpinner";
import { GoogleIcon } from "./GoogleIcon";

interface GoogleSignInButtonProps {
  text?: "signin_with" | "signup_with";
  disabled?: boolean;
  onError?: (error: string) => void;
}

export const GoogleSignInButton = ({
  text = "signin_with",
  disabled,
  onError,
}: GoogleSignInButtonProps) => {
  const { googleLoading, googleWrapperRef, triggerGoogle } = useGoogleAuth();

  const handleClick = async () => {
    try {
      triggerGoogle();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Google sign-in failed";
      onError?.(message);
    }
  };

  return (
    <>
      {/* Hidden real Google button */}
      <div
        ref={googleWrapperRef}
        style={{ display: "none" }}
        aria-hidden="true"
      />

      {/* Custom Google Button */}
      <button
        type="button"
        onClick={handleClick}
        disabled={googleLoading || disabled}
        className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 text-gray-700 font-medium py-3 px-4 rounded-lg shadow-sm transition-colors"
      >
        {googleLoading ? (
          <>
            <LoadingSpinner size="sm" />
            Connecting...
          </>
        ) : (
          <>
            <GoogleIcon />
            {text === "signin_with"
              ? "Sign in with Google"
              : "Sign up with Google"}
          </>
        )}
      </button>
    </>
  );
};
