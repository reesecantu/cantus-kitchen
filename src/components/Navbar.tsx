import { Link } from "react-router";
import logoLongBlue from "../assets/logo_long_blue.png";

export const Navbar = () => {
  // TODO: Replace with actual useAuth() hook implementation
  const user = null; // This will be replaced with useAuth() later
  const username = "John Doe"; // This will come from user object later

  return (
    <nav className="fixed top-0 z-40 w-full backdrop-blur-lg shadow-md bg-slate-50 border-b border-gray-500">
      <div className="mx-auto max-w-7xl">
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
          <div className="flex items-center space-x-10 mr-10">
            {/* Desktop Navigation */}
            <div
              className="hidden md:flex items-center space-x-12"
              role="menu"
              aria-label="Main navigation"
            >
              <Link
                to="/recipes"
                className="text-gray-700 text-l hover:text-gray-800 transition-colors font-medium"
                role="menuitem"
              >
                Recipes
              </Link>
              <Link
                to="/grocery-lists"
                className="text-gray-700 text-l hover:text-gray-800 transition-colors font-medium"
                role="menuitem"
              >
                Grocery Lists
              </Link>
              <Link
                to="/"
                className="text-gray-700 text-l hover:text-gray-800 transition-colors font-medium"
                role="menuitem"
              >
                Instagram
              </Link>
            </div>
            {/* Auth */}
            <div className="hidden md:flex items-center space-x-4 pl-10">
              {user ? (
                <div className="flex items-center space-x-3">
                  <span className="text-slate-700 font-medium">
                    Welcome, {username}
                  </span>
                  <button
                    onClick={() => {
                      // TODO: Implement logout functionality
                      console.log("Logout clicked");
                    }}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                    <Link
                        to="/sign-in"
                        className="text-l text-gray-700 hover:text-gray-800 transition-colors font-medium hover:cursor-pointer"
                    >
                        Sign in
                    </Link>
                    <span className="text-slate-600 select-none">|</span>
                    <Link
                        to="/sign-up"
                        className="text-l text-blue-500 hover:text-blue-600 transition-colors font-medium hover:cursor-pointer"
                    >
                        Sign up
                    </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
