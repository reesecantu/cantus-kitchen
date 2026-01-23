import { Route, Routes, useLocation } from "react-router";
import { useEffect } from "react";
import { Home } from "./features/home/pages/Home";
import { Navbar } from "./shared/components/Navbar";
import { SignIn } from "./features/auth/pages/SignIn";
import { SignUp } from "./features/auth/pages/SignUp";
import { RecipesPage } from "./features/recipes/pages/RecipesPage";
import { CreatePage } from "./features/recipes/pages/CreatePage";
import { RecipeDetailsPage } from "./features/recipes/pages/RecipeDetailsPage";
import { GroceryListsPage } from "./features/grocery-lists/pages/GroceryListsPage";
import { GroceryListDetailsPage } from "./features/grocery-lists/pages/GroceryListDetailsPage";
import { ForgotPassword } from "./features/auth/pages/ForgotPassword";
import { ResetPassword } from "./features/auth/pages/ResetPassword";
import { Footer } from "./shared/components/Footer";
import { ROUTES } from "./utils/constants";
import { isAuthRoute } from "./utils/routeHelper";
import { Analytics } from "@vercel/analytics/react";

function App() {
  const location = useLocation();
  const hideNavbar = isAuthRoute(location.pathname);

  const ScrollToTop = () => {
    const { pathname } = useLocation();

    useEffect(() => {
      window.scrollTo(0, 0);
    }, [pathname]);

    return null;
  };

  return (
    <div>
      <ScrollToTop />
      {!hideNavbar && <Navbar />}
      <div className={hideNavbar ? "min-h-screen" : "min-h-screen pt-20"}>
        <Routes>
          <Route path={ROUTES.HOME} element={<Home />} />
          <Route path={ROUTES.SIGN_IN} element={<SignIn />} />
          <Route path={ROUTES.SIGN_UP} element={<SignUp />} />
          <Route path={ROUTES.RECIPES} element={<RecipesPage />} />
          <Route path={ROUTES.CREATE_RECIPE} element={<CreatePage />} />
          <Route
            path={ROUTES.RECIPE_DETAILS_PATTERN}
            element={<RecipeDetailsPage />}
          />
          <Route path={ROUTES.GROCERY_LISTS} element={<GroceryListsPage />} />
          <Route
            path={ROUTES.GROCERY_LIST_DETAILS_PATTERN}
            element={<GroceryListDetailsPage />}
          />
          <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
          <Route path={ROUTES.RESET_PASSWORD} element={<ResetPassword />} />
        </Routes>
      </div>
      <Footer />
      <Analytics />
    </div>
  );
}

export default App;
