import { useState } from "react";
import type { FormErrors } from "../../types/auth";
import { VALIDATION_MESSAGES, VALIDATION_RULES } from "../../utils/constants";

interface ValidationRules {
  email?: boolean;
  password?: boolean;
  confirmPassword?: boolean;
}

export const useFormValidation = () => {
  const [errors, setErrors] = useState<FormErrors>({});

  const validateEmail = (email: string): string | undefined => {
    if (!email) return VALIDATION_MESSAGES.EMAIL_REQUIRED;
    if (!VALIDATION_RULES.EMAIL_REGEX.test(email))
      return VALIDATION_MESSAGES.EMAIL_INVALID;
    return undefined;
  };

  const validatePassword = (password: string): string | undefined => {
    if (!password) return VALIDATION_MESSAGES.PASSWORD_REQUIRED;
    if (password.length < VALIDATION_RULES.PASSWORD_MIN_LENGTH)
      return VALIDATION_MESSAGES.PASSWORD_TOO_SHORT;
    if (!VALIDATION_RULES.PASSWORD_REGEX.test(password))
      return VALIDATION_MESSAGES.PASSWORD_COMPLEXITY;
    return undefined;
  };

  const validateConfirmPassword = (
    password: string,
    confirmPassword: string
  ): string | undefined => {
    if (!confirmPassword) return VALIDATION_MESSAGES.CONFIRM_PASSWORD_REQUIRED;
    if (password !== confirmPassword) return VALIDATION_MESSAGES.PASSWORDS_DONT_MATCH;
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
