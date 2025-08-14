import { useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import chef from "../assets/chef-blue.svg";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";

interface FormErrors {
  email?: string;
  general?: string;
}

export const ForgotPassword = () => {
  const { resetPassword } = useAuth();

  // Form state
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isEmailSent, setIsEmailSent] = useState(false);

  // Email validation
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate email
    if (!email) {
      setErrors({ email: "Email is required" });
      return;
    }

    if (!validateEmail(email)) {
      setErrors({ email: "Please enter a valid email address" });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      await resetPassword(email);
      setIsEmailSent(true);
    } catch (error: unknown) {
      console.error("Password reset failed:", error);

      let errorMessage = "Failed to send reset email. Please try again.";

      if (error instanceof Error) {
        errorMessage = error.message;
      }

      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  if (isEmailSent) {
    return (
      <section className="bg-gray-100 min-h-screen flex flex-col justify-center items-center py-8">
        <div className="bg-white rounded-2xl shadow-2xl p-8 m-4 w-full max-w-md text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Check Your Email
            </h1>
            <p className="text-gray-600 mb-4">
              We've sent a password reset link to:
            </p>
            <p className="text-sm font-medium text-gray-900 bg-gray-50 rounded-lg p-2 mb-4">
              {email}
            </p>
            <p className="text-sm text-gray-500">
              Click the link in your email to reset your password. The link will
              expire in 1 hour.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => {
                setIsEmailSent(false);
                setEmail("");
              }}
              className="w-full text-blue-600 hover:text-blue-700 font-medium"
            >
              Send to a different email
            </button>

            <Link
              to="/sign-in"
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-gray-100 min-h-screen flex flex-col md:flex-row justify-center items-center py-8">
      <div className="bg-white rounded-2xl shadow-2xl p-8 m-4 flex flex-col md:flex-row items-center w-full max-w-4xl">
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
        <div className="flex-1 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Forgot Password?
            </h1>
            <p className="text-gray-600">
              No worries! Enter your email and we'll send you a reset link.
            </p>
          </div>

          {/* General Error Message */}
          {errors.general && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div>
              <input
                className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                  errors.email
                    ? "border-red-300 bg-red-50"
                    : "border-gray-300 focus:border-blue-500"
                }`}
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) {
                    setErrors((prev) => ({ ...prev, email: undefined }));
                  }
                }}
                required
                disabled={loading}
                autoComplete="email"
                autoFocus
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <LoadingSpinner/>
                  Sending Reset Link...
                </span>
              ) : (
                "Send Reset Link"
              )}
            </button>
          </form>

          {/* Back to Sign In */}
          <div className="mt-6 text-center">
            <Link
              to="/sign-in"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              ← Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
