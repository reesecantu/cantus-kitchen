import { useRef, useEffect, useCallback, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import { isSupabaseError, type GoogleCredentialResponse } from "../../types/auth";

export const useGoogleAuth = () => {
  const { signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [googleLoading, setGoogleLoading] = useState(false);
  const googleWrapperRef = useRef<HTMLDivElement | null>(null);
  const googleRealButtonRef = useRef<HTMLDivElement | null>(null);
  const googleInitializedRef = useRef(false);

  const handleGoogleSignIn = useCallback(
    async (response: GoogleCredentialResponse) => {
      setGoogleLoading(true);
      try {
        await signInWithGoogle(response);
        navigate("/", { replace: true });
      } catch (error: unknown) {
        console.error("Google sign-in failed:", error);
        let errorMessage = "Google sign-in failed. Please try again.";
        if (isSupabaseError(error)) errorMessage = error.message;
        else if (error instanceof Error) errorMessage = error.message;
        throw new Error(errorMessage);
      } finally {
        setGoogleLoading(false);
      }
    },
    [signInWithGoogle, navigate]
  );

  useEffect(() => {
    if (googleInitializedRef.current) return;

    const ensureScript = () =>
      new Promise<void>((resolve) => {
        if (
          document.querySelector(
            'script[src="https://accounts.google.com/gsi/client"]'
          )
        ) {
          return resolve();
        }
        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.onload = () => resolve();
        document.body.appendChild(script);
      });

    ensureScript().then(() => {
      if (!window.google || !googleWrapperRef.current) return;
      if (googleInitializedRef.current) return;

      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: handleGoogleSignIn,
      });

      window.google.accounts.id.renderButton(googleWrapperRef.current, {
        theme: "filled_blue",
        size: "large",
        type: "standard",
        shape: "rectangular",
        text: "signin_with",
        logo_alignment: "left",
      });

      googleRealButtonRef.current =
        googleWrapperRef.current.querySelector("div[role=button]");
      googleInitializedRef.current = true;
    });
  }, [handleGoogleSignIn]);

  const triggerGoogle = () => {
    setGoogleLoading(true);
    requestAnimationFrame(() => {
      googleRealButtonRef.current?.click();
    });
  };

  return {
    googleLoading,
    googleWrapperRef,
    triggerGoogle,
  };
};
