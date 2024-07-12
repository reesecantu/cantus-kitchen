import { Link } from "react-router-dom";
import { useAuth } from "../../Auth";
import "./Navbar.css";

function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar" role="navigation" aria-label="main navigation">
      <ul>
        <li>
          <Link to="/">Home</Link>
        </li>
        <li>
          <Link to="/lily">Lily</Link>
        </li>
        {user && (
          <li>
            <button onClick={logout}>Logout</button>
          </li>
        )}
      </ul>
    </nav>
  );
}

export default Navbar;
