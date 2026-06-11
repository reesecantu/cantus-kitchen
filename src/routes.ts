import { type RouteConfig, index, route } from "@react-router/dev/routes";
import { ROUTES } from "./utils/constants";

export default [
  index("routes/home.tsx"),
  route(ROUTES.RECIPES, "routes/recipes.tsx"),
  route(ROUTES.RECIPE_DETAILS_PATTERN, "routes/recipe-details.tsx"),
  route(ROUTES.CREATE_RECIPE, "routes/create.tsx"),
  route(ROUTES.GROCERY_LISTS, "routes/grocery-lists.tsx"),
  route(ROUTES.GROCERY_LIST_DETAILS_PATTERN, "routes/grocery-list-details.tsx"),
  route(ROUTES.SIGN_IN, "routes/sign-in.tsx"),
  route(ROUTES.SIGN_UP, "routes/sign-up.tsx"),
  route(ROUTES.FORGOT_PASSWORD, "routes/forgot-password.tsx"),
  route(ROUTES.RESET_PASSWORD, "routes/reset-password.tsx"),
] satisfies RouteConfig;
