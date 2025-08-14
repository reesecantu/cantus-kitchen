import { Route, Routes, useLocation } from "react-router";
import { useEffect } from "react";
import { Home } from "./pages/Home";
import { Navbar } from "./components/Navbar";
import { SignIn } from "./pages/SignIn";
import { SignUp } from "./pages/SignUp";
import { RecipesPage } from "./pages/RecipesPage";
import { CreatePage } from "./pages/CreatePage";
import { RecipeDetailsPage } from "./pages/RecipeDetailsPage";
import { GroceryListsPage } from "./pages/GroceryListsPage";
import { GroceryListDetailsPage } from "./pages/GroceryListDetailsPage";
import { ForgotPassword } from "./pages/ForgotPassword";
import { ResetPassword } from "./pages/ResetPassword";
import { Footer } from "./components/Footer";
import { ROUTES } from "./utils/constants";

function App() {
  const location = useLocation();
  const hideNavbar = [
    ROUTES.SIGN_IN,
    ROUTES.SIGN_UP,
    ROUTES.FORGOT_PASSWORD,
    ROUTES.RESET_PASSWORD,
  ].includes(location.pathname);

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
    </div>
  );
}

export default App;
