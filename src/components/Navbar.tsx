import { Link } from "react-router";
import logoLongBlue from "../assets/logo_long_blue.png";

export const Navbar = () => {
  // TODO: Replace with actual useAuth() hook implementation
  const user = null; // This will be replaced with useAuth() later
  const username = "John Doe"; // This will come from user object later

  return (
    <nav className="fixed top-0 z-40 w-full backdrop-blur-lg shadow-lg bg-blue-500">
      <div className="mx-auto">
        <div className="flex items-center h-20 justify-between px-8">
          {/* Left Section - Logo */}
          <div className="flex-shrink-0 pl-4">
            <Link to="/">
              <img
                src={logoLongBlue}
                alt="Cantus Kitchen Logo"
                className="h-15"
              />
            </Link>
          </div>

          {/* Navigation */}
          <div className="flex items-center space-x-10">
            {/* Desktop Navigation */}
            <div
              className="hidden md:flex items-center space-x-12"
              role="menu"
              aria-label="Main navigation"
            >
              <Link
                to="/recipes"
                className="text-white text-xl hover:text-blue-100 transition-colors font-medium"
                role="menuitem"
              >
                Recipes
              </Link>
              <Link
                to="/grocery-lists"
                className="text-white text-xl hover:text-blue-100 transition-colors font-medium"
                role="menuitem"
              >
                Grocery Lists
              </Link>
              <Link
                to="/"
                className="text-white text-xl hover:text-blue-100 transition-colors font-medium"
                role="menuitem"
              >
                Instagram
              </Link>
            </div>
            {/* Auth */}
            <div className="hidden md:flex items-center space-x-4 pr-3">
              {user ? (
                <div className="flex items-center space-x-3">
                  <span className="text-white font-medium">
                    Welcome, {username}
                  </span>
                  <button
                    onClick={() => {
                      // TODO: Implement logout functionality
                      console.log("Logout clicked");
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    // TODO: Implement login functionality
                    console.log("Login clicked");
                  }}
                  className="bg-white text-xl hover:bg-blue-50 text-blue-500 px-6 py-2 rounded-lg transition-colors font-medium border border-white"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
