// import kitchen from "../assets/kitchen-amber.svg";

import {
  CookingPot,
  NotepadText,
  LayoutGrid,
  ShoppingCart,
} from "lucide-react";
import { Link } from "react-router";
import { Testimonials } from "../components/Testimonials";
import { ROUTES } from "../utils/constants";

export const Home = () => {
  const scrollToAbout = () => {
    const aboutSection = document.getElementById("about-section");
    if (aboutSection) {
      aboutSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <div className="bg-blue-500 py-20">
        <div className="px-6 sm:px-10 lg:px-20 py-12 lg:py-0">
          <h1 className="text-6xl sm:text-7xl lg:text-8xl xl:text-9xl font-semibold text-slate-50 leading-tight">
            Hello <br />
            Friends!
          </h1>
          <p className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-medium text-slate-50 whitespace-nowrap cursor-pointer">
            Welcome to{" "}
            <button
              onClick={scrollToAbout}
              className="italic underline decoration-amber-400 decoration-2 md:decoration-4 hover:decoration-amber-300 transition-colors cursor-pointer bg-transparent border-none p-0 font-inherit text-inherit"
            >
              Cantu's Kitchen
            </button>
          </p>

          {/* Add CTA button
          <div className="mt-8">
            <Link
              to={ROUTES.RECIPES}
              className="inline-block bg-amber-400 hover:bg-amber-500 text-white font-semibold px-4 py-2 rounded-lg text-lg transition-colors"
            >
              Start Cooking
            </Link>
          </div> */}
        </div>
      </div>

      <Testimonials />

      {/* How It Works Section */}
      <div className="py-16 px-6 sm:px-10 lg:px-20 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl lg:text-5xl text-gray-800 font-bold text-center mb-4">
            Grocery Lists, Automated
          </h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-3xl mx-auto">
            From recipe selection to organized shopping lists in just three
            simple steps
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 mx-8 md:mx-0">
            {/* Step 1 */}
            <div className="flex flex-col items-center bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
              <div className="bg-blue-500 rounded-full p-4 mb-6">
                <CookingPot className="h-12 w-12 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3 text-center">
                Choose Your Recipes
              </h3>
              <p className="text-gray-600 text-center leading-relaxed">
                Browse our recipe collection or add your own favorites to plan
                your meals
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
              <div className="bg-blue-500 rounded-full p-4 mb-6">
                <NotepadText className="h-12 w-12 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3 text-center">
                Generate Your List
              </h3>
              <p className="text-gray-600 text-center leading-relaxed">
                Automatically create a comprehensive shopping list from your
                selected recipes
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
              <div className="bg-blue-500 rounded-full p-4 mb-6">
                <LayoutGrid className="h-12 w-12 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3 text-center">
                Shop Efficiently
              </h3>
              <p className="text-gray-600 text-center leading-relaxed">
                Items organized by grocery store aisle for the most efficient
                shopping experience
              </p>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center mt-12">
            <Link
              to={ROUTES.GROCERY_LISTS}
              className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold px-8 py-4 rounded-lg text-lg transition-colors"
            >
              <ShoppingCart className="h-5 w-5" />
              Create Your First List
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 px-6 sm:px-10 lg:px-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-8">
            Why Choose Cantu's Kitchen?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="text-left">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                Smart Organization
              </h3>
              <p className="text-gray-600">
                Ingredients automatically grouped by grocery store aisle for
                efficient shopping
              </p>
            </div>
            <div className="text-left">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                Recipe Management
              </h3>
              <p className="text-gray-600">
                Store and organize your favorite recipes in one convenient
                location
              </p>
            </div>
            <div className="text-left">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                Meal Planning
              </h3>
              <p className="text-gray-600">
                Plan multiple meals and generate comprehensive shopping lists
                instantly
              </p>
            </div>
            <div className="text-left">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                Time Saving
              </h3>
              <p className="text-gray-600">
                Spend less time planning and shopping, more time cooking and
                enjoying meals
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* About Section */}
      <div
        id="about-section"
        className="py-20 px-6 sm:px-10 lg:px-20 bg-amber-50"
      >
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-8">
            About Cantu's Kitchen
          </h2>
          <p className="text-xl text-gray-600 leading-relaxed mb-8">
            Born from a love of cooking and a desire to make meal planning
            effortless, Cantu's Kitchen helps home cooks organize their recipes
            and streamline their grocery shopping experience.
          </p>
          <p className="text-lg text-gray-600 leading-relaxed">
            Whether you're meal prepping for the week or planning a special
            dinner, our platform makes it easy to go from inspiration to
            organized shopping list in minutes.
          </p>
        </div>
      </div>
    </div>
  );
};
