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
          <Link to="/recipes">Recipes</Link>
        </li>
        <li>
          <Link to="/quiz">Recipe Picker</Link>
        </li>
        {user && (
          <li>
            <Link to="lily">Lily</Link>
          </li>
        )}
        {user && (
          <li>
            <Link to="recipe-manager">Recipe Manager</Link>
          </li>
        )}
        {user && (
          <li>
            <button onClick={logout}>Logout</button>
          </li>
        )}
        {!user && (
          <li className="right">
            <Link to="login">Login</Link>
          </li>
        )}
      </ul>
    </nav>
  );
}

export default Navbar;
