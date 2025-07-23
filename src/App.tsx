import { Route, Routes, useLocation } from "react-router";
import { Home } from "./pages/Home";
import { Navbar } from "./components/Navbar";
import { SignIn } from "./pages/SignIn";
import { SignUp } from "./pages/SignUp";

function App() {
  const location = useLocation();
  const hideNavbar = ["/sign-in", "/sign-up", "/forgot-password"].includes(
    location.pathname
  );

  return (
    <div>
      {!hideNavbar && <Navbar />}
      <div className={hideNavbar ? "" : "pt-20"}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/sign-up" element={<SignUp />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
