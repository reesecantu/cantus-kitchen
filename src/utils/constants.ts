export const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 8,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_REGEX: /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
} as const;

export const VALIDATION_MESSAGES = {
  EMAIL_REQUIRED: "Email is required",
  EMAIL_INVALID: "Please enter a valid email address",
  PASSWORD_REQUIRED: "Password is required",
  PASSWORD_TOO_SHORT: "Password must be at least 8 characters",
  PASSWORD_COMPLEXITY: "Password must contain uppercase, lowercase, and number",
  PASSWORDS_DONT_MATCH: "Passwords do not match",
  CONFIRM_PASSWORD_REQUIRED: "Please confirm your password",
} as const;

export const ROUTES = {
  HOME: "/",
  RECIPES: "/recipes",
  GROCERY_LISTS: "/grocery-lists",
  CREATE_RECIPE: "/create",
  SIGN_IN: "/sign-in",
  SIGN_UP: "/sign-up",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",

  // Route patterns for React Router
  RECIPE_DETAILS_PATTERN: "/recipe/:id",
  RECIPE_EDIT_PATTERN: "/recipe/:id/edit",
  GROCERY_LIST_DETAILS_PATTERN: "/grocery-list/:id",

  // Dynamic route builders
  RECIPE_DETAILS: (id: string) => `/recipe/${id}`,
  RECIPE_EDIT: (id: string) => `/recipe/${id}/edit`,
  GROCERY_LIST_DETAILS: (id: string) => `/grocery-list/${id}`,
} as const;

export const COLORS = {
  // Text colors
  TEXT_PRIMARY: "text-gray-800",
  TEXT_PRIMARY_HOVER: "hover:text-gray-900",
  TEXT_SECONDARY: "text-gray-600",

  // Background colors
  BG_PRIMARY: "bg-slate-50",
  BG_WHITE: "bg-white",
  BG_GRAY_LIGHT: "bg-gray-50",

  // Button colors
  BUTTON_PRIMARY: "bg-gray-600",
  BUTTON_PRIMARY_HOVER: "hover:bg-gray-700",
  BUTTON_SECONDARY: "bg-gray-100",
  BUTTON_SECONDARY_HOVER: "hover:bg-gray-200",

  // Accent colors
  ACCENT_BG: "bg-amber-200",
  ACCENT_BG_HOVER: "hover:bg-amber-300",
  ACCENT_TEXT: "text-amber-800",

  // Border colors
  BORDER_PRIMARY: "border-gray-600",
  BORDER_LIGHT: "border-gray-200",

  // Focus states
  FOCUS_RING: "focus:ring-2 focus:ring-blue-500",
} as const;
