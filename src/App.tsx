import { Routes, Route } from "react-router-dom";
import Homepage from "./pages/Homepage";
import Login from "./pages/Login";

import { useEffect, useState } from "react";
import Lily from "./pages/Lily";

/**
 * The main component of the application. Houses the routing logic.
 *
 * @returns The rendered JSX elements.
 */
function App() {
  const [token, setToken] = useState<string | null>(null);

  if (token) sessionStorage.setItem("token", JSON.stringify(token));

  useEffect(() => {
    if (sessionStorage.getItem("token")) {
      let data = JSON.parse(sessionStorage.getItem("token")!);
      setToken(data);
    }
  }, []);

  return (
    <>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/login" element={<Login setToken={setToken} />} />
        <Route path="/lily" element={<Lily />} />
      </Routes>
    </>
  );
}

export default App;
