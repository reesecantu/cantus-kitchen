
import { CheckCircle } from "lucide-react";
import { ROUTES } from "../../utils/constants";
import { Link } from "react-router";

export const ConfirmationSent = () => (
  <div className="flex flex-col items-center justify-center py-12 px-6">
    <CheckCircle className="h-16 w-16 text-blue-500 mb-4" />
    <h2 className="text-2xl font-bold text-blue-600 mb-2">
      Confirmation Email Sent!
    </h2>
    <p className="text-gray-700 text-center mb-6 max-w-md">
      We've sent a confirmation email to your inbox. Please check your email and
      click the link to activate your account.
      <br />
      <br />
      If you don't see it, check your spam or promotions folder.
    </p>
    <Link
      to={ROUTES.SIGN_IN}
      className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
    >
      Back to Sign In
    </Link>
  </div>
);
