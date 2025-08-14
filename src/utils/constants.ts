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

export const ANIMATION_CONSTANTS = {
  TESTIMONIALS_AUTOPLAY_INTERVAL: 4500,
} as const;

export const ERROR_MESSAGES = {
  AUTH: {
    GOOGLE_SIGNIN_FAILED: "Google sign-in failed. Please try again.",
    EMAIL_SIGNIN_FAILED: "Sign-in failed. Please try again.",
    SIGNUP_FAILED: "Sign-up failed. Please try again.",
    GUEST_SIGNIN_FAILED: "Guest sign-in failed. Please try again.",
    INVALID_CREDENTIALS: "Invalid email or password. Please try again.",
    EMAIL_NOT_CONFIRMED: "Please check your email and confirm your account.",
    TOO_MANY_REQUESTS: "Too many attempts. Please try again later.",
  },
  GROCERY_LISTS: {
    LOAD_FAILED: "Error loading grocery lists. Please try again.",
    CREATE_FAILED: "Failed to create grocery list. Please try again.",
    UPDATE_FAILED: "Failed to update grocery list. Please try again.",
    DELETE_FAILED: "Failed to delete grocery list. Please try again.",
    ITEM_REMOVE_FAILED: "Error removing grocery list item",
  },
  GENERAL: {
    USER_NOT_AUTHENTICATED: "User not authenticated",
    NETWORK_ERROR: "Network error. Please check your connection.",
  },
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
  GROCERY_LIST_DETAILS_PATTERN: "/grocery-list/:id",

  // Dynamic route builders
  RECIPE_DETAILS: (id: string) => `/recipe/${id}`,
  GROCERY_LIST_DETAILS: (id: string) => `/grocery-list/${id}`,
} as const;
