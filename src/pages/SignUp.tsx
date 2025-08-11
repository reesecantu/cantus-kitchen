import { Link, useNavigate } from "react-router";
import { useEffect, useCallback, useState } from "react";
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

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Email validation
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

  // Google Sign-In setup
  useEffect(() => {
    // Check if script already exists
    if (
      document.querySelector(
        'script[src="https://accounts.google.com/gsi/client"]'
      )
    ) {
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      setTimeout(() => {
        if (window.google && document.getElementById("google-signin-button")) {
          window.google.accounts.id.initialize({
            client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
            callback: handleGoogleSignIn,
          });

          const buttonElement = document.getElementById("google-signin-button");
          if (buttonElement) {
            window.google.accounts.id.renderButton(buttonElement, {
              type: "standard",
              shape: "rectangular",
              theme: "filled_blue",
              text: "signup_with",
              size: "large",
              logo_alignment: "left",
            });
          }
        }
      }, 100);
    };

    return () => {
      const existingScript = document.querySelector(
        'script[src="https://accounts.google.com/gsi/client"]'
      );
      if (existingScript?.parentNode) {
        existingScript.parentNode.removeChild(existingScript);
      }
    };
  }, [handleGoogleSignIn]);

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

          {/* Google Sign-In Button */}
          <div className="mb-6">
            <div
              id="google-signin-button"
              className={googleLoading ? "opacity-50 pointer-events-none" : ""}
            />
            {googleLoading && (
              <div className="text-center mt-2 text-sm text-gray-600">
                Signing up with Google...
              </div>
            )}
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
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
