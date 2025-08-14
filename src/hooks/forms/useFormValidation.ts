import { useState } from "react";
import type { FormErrors } from "../../types/auth";


interface ValidationRules {
  email?: boolean;
  password?: boolean;
  confirmPassword?: boolean;
}

export const useFormValidation = () => {
  const [errors, setErrors] = useState<FormErrors>({});

  const validateEmail = (email: string): string | undefined => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return "Email is required";
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    return undefined;
  };

  const validatePassword = (password: string): string | undefined => {
    if (!password) return "Password is required";
    if (password.length < 8) return "Password must be at least 8 characters";
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return "Password must contain uppercase, lowercase, and number";
    }
    return undefined;
  };

  const validateConfirmPassword = (
    password: string,
    confirmPassword: string
  ): string | undefined => {
    if (!confirmPassword) return "Please confirm your password";
    if (password !== confirmPassword) return "Passwords do not match";
    return undefined;
  };

  const validateForm = (
    data: { email?: string; password?: string; confirmPassword?: string },
    rules: ValidationRules
  ): boolean => {
    const newErrors: FormErrors = {};

    if (rules.email && data.email !== undefined) {
      const emailError = validateEmail(data.email);
      if (emailError) newErrors.email = emailError;
    }

    if (rules.password && data.password !== undefined) {
      const passwordError = validatePassword(data.password);
      if (passwordError) newErrors.password = passwordError;
    }

    if (
      rules.confirmPassword &&
      data.password &&
      data.confirmPassword !== undefined
    ) {
      const confirmError = validateConfirmPassword(
        data.password,
        data.confirmPassword
      );
      if (confirmError) newErrors.confirmPassword = confirmError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const clearError = (field: keyof FormErrors) => {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const setError = (field: keyof FormErrors, message: string) => {
    setErrors((prev) => ({ ...prev, [field]: message }));
  };

  return {
    errors,
    validateForm,
    clearError,
    setError,
    setErrors,
  };
};
