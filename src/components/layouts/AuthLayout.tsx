import chef from "../../assets/chef-blue.svg";
import type { FormErrors } from "../../types/auth";

interface AuthLayoutProps {
  title: string;
  children: React.ReactNode;
  errors?: FormErrors;
  successMessage?: string;
}

export const AuthLayout = ({
  title,
  children,
  errors,
  successMessage,
}: AuthLayoutProps) => {
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
        <div className="flex-1 w-full max-w-md">
          <div className="text-center mb-4">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
          </div>

          {/* General Error Message */}
          {errors?.general && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {errors.general}
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
              {successMessage}
            </div>
          )}

          {children}
        </div>
      </div>
    </section>
  );
};
