import { Routes, Route } from "react-router-dom";
import Homepage from "./pages/Homepage";
import Login from "./pages/Login";
import Lily from "./pages/Lily";
import { ProtectedRouteWithRoles } from "./components/ProtectedRoute";
import RecipeManager from "./pages/RecipeManager";
import Navbar from "./components/Navbar/Navbar";
import RecipeBook from "./pages/RecipeBook";
import GroceryListGenerator from "./pages/GroceryListGenerator";
import RecipeQuiz from "./pages/RecipeQuiz";

/**
 * The main component of the application. Houses the routing logic.
 *
 * @returns The rendered JSX elements.
 */
function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/recipes" element={<RecipeBook />} />
        <Route
          path="/grocery-list-generator"
          element={<GroceryListGenerator />}
        />
        <Route path="/quiz" element={<RecipeQuiz />} />
        <Route
          path="/lily"
          element={
            <ProtectedRouteWithRoles requiredRoles={["admin", "lily"]}>
              <Lily />
            </ProtectedRouteWithRoles>
          }
        />
        <Route
          path="/recipe-manager"
          element={
            <ProtectedRouteWithRoles requiredRoles={["admin"]}>

              <RecipeManager />
            </ProtectedRouteWithRoles>
          }
        />
      </Routes>
    </>
  );
}

export default App;
