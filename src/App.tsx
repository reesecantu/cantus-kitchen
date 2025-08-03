import { Route, Routes, useLocation } from "react-router";
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

function App() {
  const location = useLocation();
  const hideNavbar = [
    "/sign-in",
    "/sign-up",
    "/forgot-password",
    "/reset-password",
  ].includes(location.pathname);

  return (
    <div>
      {!hideNavbar && <Navbar />}
      <div className={hideNavbar ? "pb-20" : "pt-20 pb-20"}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/sign-up" element={<SignUp />} />
          <Route path="/recipes" element={<RecipesPage />} />
          <Route path="/create" element={<CreatePage />} />
          <Route path="/recipe/:id" element={<RecipeDetailsPage />} />
          <Route path="/grocery-lists" element={<GroceryListsPage />} />
          <Route
            path="/grocery-list/:id"
            element={<GroceryListDetailsPage />}
          />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
