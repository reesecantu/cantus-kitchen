import { Link, useNavigate } from "react-router";
import { useEffect, useCallback, useState, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import chef from "../assets/chef-blue.svg";

// Define proper types
interface GoogleCredentialResponse {
  credential: string;
  select_by?: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

interface SupabaseError {
  message: string;
  status?: number;
}

const isSupabaseError = (error: unknown): error is SupabaseError => {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as SupabaseError).message === "string"
  );
};

export const SignUp = () => {
  const { signInWithGoogle, signUpWithEmail, signInAnonymously } = useAuth();
  const navigate = useNavigate();

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);

  // Hidden Google button refs
  const googleWrapperRef = useRef<HTMLDivElement | null>(null);
  const googleRealButtonRef = useRef<HTMLDivElement | null>(null);
  const googleInitializedRef = useRef(false);

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Password validation
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      newErrors.password =
        "Password must contain uppercase, lowercase, and number";
    }

    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGoogleSignIn = useCallback(
    async (response: GoogleCredentialResponse) => {
      setGoogleLoading(true);
      setErrors({});

      try {
        await signInWithGoogle(response);
        navigate("/", { replace: true });
      } catch (error: unknown) {
        console.error("Google sign-up failed:", error);

        let errorMessage = "Google sign-up failed. Please try again.";

        if (isSupabaseError(error)) {
          errorMessage = error.message;
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }

        setErrors({
          general: errorMessage,
        });
      } finally {
        setGoogleLoading(false);
      }
    },
    [signInWithGoogle, navigate]
  );

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      await signUpWithEmail(email, password);
      navigate("/", { replace: true });
    } catch (error: unknown) {
      console.error("Email sign-up failed:", error);

      let errorMessage = "Sign-up failed. Please try again.";

      if (isSupabaseError(error)) {
        // Handle Supabase errors
        errorMessage = error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleAnonymousSignIn = async () => {
    setLoading(true);
    setErrors({});

    try {
      await signInAnonymously();
      navigate("/", { replace: true });
    } catch (error: unknown) {
      console.error("Anonymous sign-in failed:", error);

      let errorMessage = "Guest sign-in failed. Please try again.";

      if (isSupabaseError(error)) {
        errorMessage = error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  // Load & init Google
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
        // ux_mode: "popup",
        // auto_select: false,
        // itp_support: true,
      });
      window.google.accounts.id.renderButton(googleWrapperRef.current, {
        theme: "filled_blue",
        size: "large",
        type: "standard",
        shape: "rectangular",
        text: "signup_with",
        logo_alignment: "left",
        // width: 300, // enforce consistent width
      });
      // Capture inner real button
      googleRealButtonRef.current =
        googleWrapperRef.current.querySelector("div[role=button]");
      googleInitializedRef.current = true;
    });
  }, [handleGoogleSignIn]);

  const triggerGoogle = () => {
    setErrors({});
    setGoogleLoading(true);
    // Defer click to ensure state updates
    requestAnimationFrame(() => {
      googleRealButtonRef.current?.click();
    });
  };

  return (
    <section className="bg-gray-100 min-h-screen flex flex-col md:flex-row justify-center items-center py-8">
      <div className="bg-white rounded-2xl shadow-2xl p-8 m-4 flex flex-col md:flex-row items-center w-full max-w-5xl">
        {/* Left side - Image */}
        <div className="flex-1 text-center mb-8 md:mb-0 md:mr-8">
          <img
            src={chef}
            alt="Kitchen"
            className="w-full h-auto max-w-md mx-auto"
          />
          <a
            href="https://storyset.com/work"
            className="text-slate-400 text-xs hover:text-slate-600"
          >
            Work illustrations by Storyset
          </a>
        </div>

        {/* Right side - Form */}
        <div className="flex-1 w-full max-w-md ml-0 m-8">
          <div className="text-center mb-4">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Create Account
            </h1>
          </div>

          {/* General Error Message */}
          {errors.general && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {errors.general}
            </div>
          )}

          {/* Hidden real Google button */}
          <div
            ref={googleWrapperRef}
            style={{ display: "none" }}
            aria-hidden="true"
          />

          {/* Custom Google Button */}
          <div className="mb-6">
            <button
              type="button"
              onClick={triggerGoogle}
              disabled={googleLoading || loading}
              className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 text-gray-700 font-medium py-3 px-4 rounded-lg shadow-sm transition-colors"
            >
              {googleLoading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-gray-500"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z"
                    />
                  </svg>
                  Connecting...
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 48 48"
                    className="h-5 w-5"
                  >
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6 1.54 7.38 2.84l5.4-5.4C33.46 3.34 28.94 1.5 24 1.5 14.82 1.5 7.09 6.98 3.69 14.41l6.91 5.36C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.5 24.5c0-1.57-.15-3.08-.38-4.5H24v9h12.7c-.55 2.82-2.2 5.2-4.7 6.8l7.27 5.64C43.86 37.52 46.5 31.5 46.5 24.5z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.6 28.77A14.47 14.47 0 019.5 24c0-1.66.29-3.27.79-4.77l-6.91-5.36A22.43 22.43 0 001.5 24c0 3.62.87 7.04 2.38 10.09l6.72-5.32z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 46.5c6.48 0 11.9-2.13 15.87-5.81l-7.27-5.64C30.52 36.52 27.5 37.5 24 37.5c-6.26 0-11.57-4.22-13.4-10.14l-6.91 5.36C7.09 41.02 14.82 46.5 24 46.5z"
                    />
                    <path fill="none" d="M1.5 1.5h45v45h-45z" />
                  </svg>
                  Sign up with Google
                </>
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                Or continue with email
              </span>
            </div>
          </div>

          {/* Email Sign-Up Form */}
          <form onSubmit={handleEmailSignUp} className="space-y-4">
            {/* Email Input */}
            <div>
              <input
                className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                  errors.email
                    ? "border-red-300 bg-red-50"
                    : "border-gray-300 focus:border-blue-500"
                }`}
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email)
                    setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                required
                disabled={loading}
                autoComplete="email"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Password Input */}
            <div>
              <div className="relative">
                <input
                  className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors pr-12 ${
                    errors.password
                      ? "border-red-300 bg-red-50"
                      : "border-gray-300 focus:border-blue-500"
                  }`}
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password)
                      setErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  required
                  disabled={loading}
                  autoComplete="new-password"
                  minLength={8}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password Input */}
            <div>
              <input
                className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                  errors.confirmPassword
                    ? "border-red-300 bg-red-50"
                    : "border-gray-300 focus:border-blue-500"
                }`}
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword)
                    setErrors((prev) => ({
                      ...prev,
                      confirmPassword: undefined,
                    }));
                }}
                required
                disabled={loading}
                autoComplete="new-password"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              type="submit"
              disabled={loading || googleLoading}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Creating Account...
                </span>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                to="/sign-in"
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                Sign in here
              </Link>
            </p>
          </div>

          {/* Guest Account Option */}
          <div className="mt-1 text-center">
            <p className="text-sm text-gray-600">
              Just browsing?{" "}
              <button
                onClick={handleAnonymousSignIn}
                disabled={loading || googleLoading}
                className="text-blue-600 hover:text-blue-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Loading..." : "Use a guest account"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
