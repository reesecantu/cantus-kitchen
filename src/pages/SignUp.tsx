import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { useFormValidation } from "../hooks/forms/useFormValidation";
import { FormInput } from "../components/ui/FormInput";
import { GoogleSignInButton } from "../components/ui/GoogleSignInButton";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { AuthLayout } from "../components/layouts/AuthLayout";
import { isSupabaseError } from "../types/auth";
import { ROUTES } from "../utils/constants";
import { ConfirmationSent } from "../components/ui/ConfirmationSent";

export const SignUp = () => {
  const { signUpWithEmail, signInAnonymously } = useAuth();
  const navigate = useNavigate();

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  // Validation
  const { errors, validateForm, clearError, setError } = useFormValidation();

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !validateForm(
        { email, password, confirmPassword },
        { email: true, password: true, confirmPassword: true }
      )
    ) {
      return;
    }

    setLoading(true);

    try {
      await signUpWithEmail(email, password);
      setConfirmationSent(true);
    } catch (error: unknown) {
      console.error("Email sign-up failed:", error);
      let errorMessage = "Sign-up failed. Please try again.";

      if (isSupabaseError(error)) {
        const message = error.message.toLowerCase();
        if (message.includes("user already registered")) {
          errorMessage =
            "An account with this email already exists. Please sign in instead.";
        } else if (message.includes("password")) {
          errorMessage =
            "Password does not meet requirements. Please try a stronger password.";
        } else if (message.includes("email")) {
          errorMessage = "Please enter a valid email address.";
        } else {
          errorMessage = error.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      setError("general", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAnonymousSignIn = async () => {
    setLoading(true);

    try {
      await signInAnonymously();
      navigate(ROUTES.HOME, { replace: true });
    } catch (error: unknown) {
      console.error("Anonymous sign-in failed:", error);
      let errorMessage = "Guest sign-in failed. Please try again.";

      if (isSupabaseError(error)) errorMessage = error.message;
      else if (error instanceof Error) errorMessage = error.message;

      setError("general", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {confirmationSent ? (
        <ConfirmationSent />
      ) : (
        <AuthLayout title="Create Account" errors={errors}>
          <GoogleSignInButton
            text="signup_with"
            disabled={loading}
            onError={(error) => setError("general", error)}
          />

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                Or continue with email
              </span>
            </div>
          </div>

          <form onSubmit={handleEmailSignUp} className="space-y-4">
            <FormInput
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) clearError("email");
              }}
              error={errors.email}
              required
              disabled={loading}
              autoComplete="email"
            />

            <FormInput
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) clearError("password");
              }}
              error={errors.password}
              showPasswordToggle
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword(!showPassword)}
              required
              disabled={loading}
              autoComplete="new-password"
            />

            <FormInput
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errors.confirmPassword) clearError("confirmPassword");
              }}
              error={errors.confirmPassword}
              required
              disabled={loading}
              autoComplete="new-password"
            />

            <button
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <LoadingSpinner size="sm" color="white" className="mr-3" />
                  Creating Account...
                </span>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                to={ROUTES.SIGN_IN}
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                Sign in here
              </Link>
            </p>
          </div>

          <div className="mt-1 text-center">
            <p className="text-sm text-gray-600">
              Just browsing?{" "}
              <button
                onClick={handleAnonymousSignIn}
                disabled={loading}
                className="text-blue-600 hover:text-blue-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Loading..." : "Use a guest account"}
              </button>
            </p>
          </div>
        </AuthLayout>
      )}
    </>
  );
};
