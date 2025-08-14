import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { useFormValidation } from "../hooks/forms";
import { FormInput } from "../components/ui/FormInput";
import { GoogleSignInButton } from "../components/ui/GoogleSignInButton";
import { isSupabaseError } from "../types/auth";
import { AuthLayout } from "../components/layouts/AuthLayout";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { ROUTES } from "../utils/constants";

export const SignIn = () => {
  const { signInWithEmail, signInAnonymously } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Validation
  const { errors, validateForm, clearError, setError } = useFormValidation();

  // Success message from password reset, etc.
  const successMessage = location.state?.message;

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm({ email, password }, { email: true, password: true })) {
      return;
    }

    setLoading(true);

    try {
      await signInWithEmail(email, password);
      navigate(ROUTES.HOME, { replace: true });
    } catch (error: unknown) {
      console.error("Email sign-in failed:", error);
      let errorMessage = "Sign-in failed. Please try again.";

      if (isSupabaseError(error)) {
        const message = error.message.toLowerCase();
        if (message.includes("invalid login credentials")) {
          errorMessage = "Invalid email or password. Please try again.";
        } else if (message.includes("email not confirmed")) {
          errorMessage = "Please check your email and confirm your account.";
        } else if (message.includes("too many requests")) {
          errorMessage = "Too many attempts. Please try again later.";
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
    <AuthLayout
      title="Welcome Back"
      errors={errors}
      successMessage={successMessage}
    >
      <GoogleSignInButton
        text="signin_with"
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

      <form onSubmit={handleEmailSignIn} className="space-y-4">
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
          autoComplete="current-password"
        />

        <div className="text-right">
          <Link
            to={ROUTES.FORGOT_PASSWORD}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Forgot password?
          </Link>
        </div>

        <button
          className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          type="submit"
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <LoadingSpinner size="sm" className="mr-3" />
              Signing In...
            </span>
          ) : (
            "Sign In"
          )}
        </button>
      </form>

      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600">
          Don't have an account?{" "}
          <Link
            to={ROUTES.SIGN_UP}
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            Sign up here
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
  );
};
