import { Link } from "react-router";
// import { SquarePlus } from "lucide-react";
import logoLongBlue from "../assets/logo_long_blue.png";
import { useAuth } from "../contexts/AuthContext";

export const Navbar = () => {
  const { user, signOut } = useAuth();

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
              className="hidden md:flex items-center space-x-12 text-gray-700 text-l hover:text-gray-800 transition-colors font-semibold"
              role="menu"
              aria-label="Main navigation"
            >
               <Link
                to="/"
                className=""
                role="menuitem"
              >
                Home
              </Link>
              <Link
                to="/recipes"
                className=""
                role="menuitem"
              >
                Recipes
              </Link>
              <Link
                to="/grocery-lists"
                className=""
                role="menuitem"
              >
                Grocery Lists
              </Link>
              <Link
                to="/create"
                className=""
              >
                {/* <SquarePlus size={24} strokeWidth={1.75}  /> */}
                Create
              </Link>
            </div>
            {/* Auth */}
            <div className="hidden md:flex items-center space-x-4 pl-12">
              {user ? (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={signOut}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-1.5 rounded transition-colors font-medium"
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
                  <span className="text-gray-700 select-none">|</span>
                  <Link
                    to="/sign-up"
                    className="bg-amber-200 hover:bg-amber-300 text-amber-800 hover:text-amber-900 px-1.5 rounded transition-colors font-medium"
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
