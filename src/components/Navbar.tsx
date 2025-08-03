import { Link } from "react-router";
import { useState } from "react";
import logoLongBlue from "../assets/logo_long_blue.png";
import { useAuth } from "../contexts/AuthContext";

export const Navbar = () => {
  const { user, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    // Close user menu when opening mobile menu
    if (isUserMenuOpen) setIsUserMenuOpen(false);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
    // Close mobile menu when opening user menu
    if (isMobileMenuOpen) setIsMobileMenuOpen(false);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const closeUserMenu = () => {
    setIsUserMenuOpen(false);
  };

  return (
    <>
      <nav className="fixed top-0 z-40 w-full backdrop-blur-lg shadow-md bg-slate-50 border-b border-gray-500">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center h-20 justify-between px-4 md:px-8">
            {/* Mobile Left - Hamburger Menu */}
            <div className="md:hidden">
              <button
                onClick={toggleMobileMenu}
                className="p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                aria-label="Open main menu"
              >
                <svg
                  className={`h-6 w-6 transition-transform duration-200 ${
                    isMobileMenuOpen ? "rotate-90" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {isMobileMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>

            {/* Desktop Left - Logo */}
            <div className="hidden md:flex flex-shrink-0">
              <Link to="/">
                <img
                  src={logoLongBlue}
                  alt="Cantus Kitchen Logo"
                  className="h-12"
                />
              </Link>
            </div>

            {/* Mobile Center - Logo */}
            <div className="md:hidden flex-1 flex justify-center">
              <Link to="/" onClick={closeMobileMenu}>
                <img
                  src={logoLongBlue}
                  alt="Cantus Kitchen Logo"
                  className="h-10"
                />
              </Link>
            </div>

            {/* Desktop Center - Navigation */}
            <div className="hidden md:flex items-center space-x-12 text-gray-700 text-lg font-semibold">
              <Link to="/" className="hover:text-gray-900 transition-colors">
                Home
              </Link>
              <Link
                to="/recipes"
                className="hover:text-gray-900 transition-colors"
              >
                Recipes
              </Link>
              <Link
                to="/grocery-lists"
                className="hover:text-gray-900 transition-colors"
              >
                Grocery Lists
              </Link>
              <Link
                to="/create"
                className="hover:text-gray-900 transition-colors"
              >
                Create
              </Link>
            </div>

            {/* Right Section */}
            <div className="flex items-center">
              {/* Desktop Auth */}
              <div className="hidden md:flex items-center space-x-4">
                {user ? (
                  <button
                    onClick={signOut}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded transition-colors font-medium"
                  >
                    Logout
                  </button>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Link
                      to="/sign-in"
                      className="text-lg text-gray-700 hover:text-gray-900 transition-colors font-medium"
                    >
                      Sign in
                    </Link>
                    <span className="text-gray-700 select-none">|</span>
                    <Link
                      to="/sign-up"
                      className="bg-amber-200 hover:bg-amber-300 text-amber-800 hover:text-amber-900 px-4 py-2 rounded transition-colors font-medium"
                    >
                      Sign up
                    </Link>
                  </div>
                )}
              </div>

              {/* Mobile User Menu */}
              <div className="md:hidden relative">
                <button
                  onClick={toggleUserMenu}
                  className="p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                  aria-label="User menu"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </button>

                {/* Mobile User Dropdown */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border">
                    {user ? (
                      <button
                        onClick={() => {
                          signOut();
                          closeUserMenu();
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Logout
                      </button>
                    ) : (
                      <>
                        <Link
                          to="/sign-in"
                          onClick={closeUserMenu}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Sign in
                        </Link>
                        <Link
                          to="/sign-up"
                          onClick={closeUserMenu}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Sign up
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link
                to="/"
                onClick={closeMobileMenu}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              >
                Home
              </Link>
              <Link
                to="/recipes"
                onClick={closeMobileMenu}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              >
                Recipes
              </Link>
              <Link
                to="/grocery-lists"
                onClick={closeMobileMenu}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              >
                Grocery Lists
              </Link>
              <Link
                to="/create"
                onClick={closeMobileMenu}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              >
                Create
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Overlay to close menus when clicking outside */}
      {(isMobileMenuOpen || isUserMenuOpen) && (
        <div
          className="fixed inset-0 z-30 bg-transparent md:hidden"
          onClick={() => {
            setIsMobileMenuOpen(false);
            setIsUserMenuOpen(false);
          }}
        />
      )}
    </>
  );
};
