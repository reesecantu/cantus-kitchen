import { Routes, Route } from "react-router-dom";
import Homepage from "./pages/Homepage";
import Login from "./pages/Login";
import Lily from "./pages/Lily";

/**
 * The main component of the application. Houses the routing logic.
 *
 * @returns The rendered JSX elements.
 */
function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/lily" element={<Lily />} />
      </Routes>
    </>
  );
}

export default App;
