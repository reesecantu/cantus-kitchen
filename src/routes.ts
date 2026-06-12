import { type RouteConfig, index, route } from "@react-router/dev/routes";
import { ROUTES } from "./utils/constants";

export default [
  index("routes/home.tsx"),
  route(ROUTES.RECIPES, "routes/recipes.tsx"),
  route(ROUTES.RECIPE_DETAILS_PATTERN, "routes/recipe-details.tsx"),
  route(ROUTES.RECIPE_EDIT_PATTERN, "routes/recipe-edit.tsx"),
  route(ROUTES.CREATE_RECIPE, "routes/create.tsx"),
  route(ROUTES.GROCERY_LISTS, "routes/grocery-lists.tsx"),
  route(ROUTES.GROCERY_LIST_DETAILS_PATTERN, "routes/grocery-list-details.tsx"),
  route(ROUTES.SIGN_IN, "routes/sign-in.tsx"),
  route(ROUTES.SIGN_UP, "routes/sign-up.tsx"),
  route(ROUTES.FORGOT_PASSWORD, "routes/forgot-password.tsx"),
  route(ROUTES.RESET_PASSWORD, "routes/reset-password.tsx"),

  route("/sitemap.xml", "routes/sitemap[.]xml.ts"),

  // Resource routes (no UI) — the app-layer replacement for the Postgres RPCs
  route("/api/grocery-lists/:listId/recipes", "routes/api.grocery-list-recipes.ts"),
  route("/api/grocery-lists/:listId/items", "routes/api.grocery-list-items.ts"),
  route("/api/recipes", "routes/api.recipes.create.ts"),
  route("/api/recipes/:recipeId", "routes/api.recipes.ts"),
  route("/api/cron/cleanup-anonymous-users", "routes/api.cron.cleanup-anonymous-users.ts"),
] satisfies RouteConfig;
