import { Link } from "react-router";
import { useState } from "react";
import logoLongBlue from "../assets/logos/long_logo_blue.png";
import stackedLogoBlue from "../assets/logos/stacked_logo_blue.png";
import { useAuth } from "../contexts/AuthContext";
import { ROUTES, COLORS } from "../utils/constants";

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
      <nav
        className={`fixed top-0 z-40 w-full backdrop-blur-lg shadow-md ${COLORS.BG_PRIMARY} border-b-2 ${COLORS.BORDER_PRIMARY}`}
      >
        <div className="mx-auto max-w-7xl md:-mb-3">
          <div className="flex items-center mt-1.5 justify-between px-4 md:px-8">
            {/* Mobile Left - Hamburger Menu */}
            <div className="md:hidden">
              <button
                onClick={toggleMobileMenu}
                className={`p-2 rounded-md ${COLORS.TEXT_PRIMARY} ${COLORS.TEXT_PRIMARY_HOVER} ${COLORS.BUTTON_SECONDARY_HOVER} focus:outline-none ${COLORS.FOCUS_RING} focus:ring-inset`}
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
            <div className="hidden lg:flex flex-shrink-0 mb-7 -mx-4">
              <Link to={ROUTES.HOME}>
                <img
                  src={logoLongBlue}
                  alt="Cantus Kitchen Logo"
                  className="h-18"
                />
              </Link>
            </div>
            <div className="hidden md:flex lg:hidden flex-shrink-0 mb-7 -mx-4">
              <Link to={ROUTES.HOME}>
                <img
                  src={stackedLogoBlue}
                  alt="Cantus Kitchen Logo"
                  className="h-18"
                />
              </Link>
            </div>

            {/* Mobile Center - Logo */}
            <div className="md:hidden flex-1 flex justify-center mb-3">
              <Link to={ROUTES.HOME} onClick={closeMobileMenu}>
                <img
                  src={stackedLogoBlue}
                  alt="Cantus Kitchen Logo"
                  className="h-15"
                />
              </Link>
            </div>

            {/* Desktop Center - Navigation */}
            <div
              className={`hidden md:flex items-center md:space-x-6 lg:space-x-12 ${COLORS.TEXT_PRIMARY} text-lg font-semibold`}
            >
              <Link
                to={ROUTES.HOME}
                className={`${COLORS.TEXT_PRIMARY_HOVER} transition-colors`}
              >
                Home
              </Link>
              <Link
                to={ROUTES.RECIPES}
                className={`${COLORS.TEXT_PRIMARY_HOVER} transition-colors`}
              >
                Recipes
              </Link>
              <Link
                to={ROUTES.GROCERY_LISTS}
                className={`${COLORS.TEXT_PRIMARY_HOVER} transition-colors`}
              >
                Grocery Lists
              </Link>
              <Link
                to={ROUTES.CREATE_RECIPE}
                className={`${COLORS.TEXT_PRIMARY_HOVER} transition-colors`}
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
                    className={`${COLORS.BUTTON_PRIMARY} ${COLORS.BUTTON_PRIMARY_HOVER} text-white px-2 py-.5 rounded transition-colors text-lg font-medium`}
                  >
                    Logout
                  </button>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Link
                      to={ROUTES.SIGN_IN}
                      className={`text-lg ${COLORS.TEXT_PRIMARY} ${COLORS.TEXT_PRIMARY_HOVER} transition-colors font-medium`}
                    >
                      Sign in
                    </Link>
                    <span className={`${COLORS.TEXT_PRIMARY} select-none`}>
                      |
                    </span>
                    <Link
                      to={ROUTES.SIGN_UP}
                      className={`text-lg ${COLORS.ACCENT_BG} ${COLORS.ACCENT_BG_HOVER} ${COLORS.ACCENT_TEXT} px-1 rounded transition-colors font-medium`}
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
                  className={`p-2 rounded-md ${COLORS.TEXT_PRIMARY} ${COLORS.TEXT_PRIMARY_HOVER} ${COLORS.BUTTON_SECONDARY_HOVER} focus:outline-none ${COLORS.FOCUS_RING} focus:ring-inset`}
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
                  <div
                    className={`absolute right-0 mt-2 w-48 ${COLORS.BG_WHITE} rounded-md shadow-lg z-50 border overflow-hidden`}
                  >
                    {user ? (
                      <button
                        onClick={() => {
                          signOut();
                          closeUserMenu();
                        }}
                        className={`block w-full text-left px-4 py-2 text-sm ${COLORS.TEXT_PRIMARY} ${COLORS.BUTTON_SECONDARY_HOVER}`}
                      >
                        Logout
                      </button>
                    ) : (
                      <>
                        <Link
                          to={ROUTES.SIGN_IN}
                          onClick={closeUserMenu}
                          className={`block px-4 py-2 text-sm ${COLORS.TEXT_PRIMARY} ${COLORS.BUTTON_SECONDARY_HOVER}`}
                        >
                          Sign in
                        </Link>
                        <Link
                          to={ROUTES.SIGN_UP}
                          onClick={closeUserMenu}
                          className={`block px-4 py-2 text-sm ${COLORS.TEXT_PRIMARY} ${COLORS.BUTTON_SECONDARY_HOVER}`}
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
          <div
            className={`md:hidden ${COLORS.BG_WHITE} border-t ${COLORS.BORDER_LIGHT}`}
          >
            <div
              className={`px-2 space-y-1 ${COLORS.TEXT_PRIMARY} font-medium`}
            >
              <Link
                to={ROUTES.HOME}
                onClick={closeMobileMenu}
                className={`block px-3 py-2 rounded-md text-base ${COLORS.TEXT_PRIMARY_HOVER} ${COLORS.BUTTON_SECONDARY_HOVER}`}
              >
                Home
              </Link>
              <Link
                to={ROUTES.RECIPES}
                onClick={closeMobileMenu}
                className={`block px-3 py-2 rounded-md text-base ${COLORS.TEXT_PRIMARY_HOVER} ${COLORS.BUTTON_SECONDARY_HOVER}`}
              >
                Recipes
              </Link>
              <Link
                to={ROUTES.GROCERY_LISTS}
                onClick={closeMobileMenu}
                className={`block px-3 py-2 rounded-md text-base ${COLORS.TEXT_PRIMARY_HOVER} ${COLORS.BUTTON_SECONDARY_HOVER}`}
              >
                Grocery Lists
              </Link>
              <Link
                to={ROUTES.CREATE_RECIPE}
                onClick={closeMobileMenu}
                className={`block px-3 py-2 rounded-md text-base ${COLORS.TEXT_PRIMARY_HOVER} ${COLORS.BUTTON_SECONDARY_HOVER}`}
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
