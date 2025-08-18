import { useState, useEffect } from "react";
import {
  CookingPot,
  NotepadText,
  LayoutGrid,
  ShoppingCart,
} from "lucide-react";
import { Link } from "react-router";
import { Testimonials } from "../components/Testimonials";
import { ROUTES, COLORS } from "../utils/constants";

// Photos for about section
import reesePhoto1 from "../assets/reese-squares/reese1.jpg";
import reesePhoto2 from "../assets/reese-squares/reese2.jpg";
import reesePhoto3 from "../assets/reese-squares/reese3.jpg";
import reesePhoto4 from "../assets/reese-squares/reese4.jpg";
import reesePhoto5 from "../assets/reese-squares/reese5.jpg";
import reesePhoto6 from "../assets/reese-squares/reese6.jpg";

export const Home = () => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const photos = [
    reesePhoto1,
    reesePhoto2,
    reesePhoto3,
    reesePhoto4,
    reesePhoto5,
    reesePhoto6,
  ];

  useEffect(() => {
    // Don't run timers during SSR
    if (typeof window === "undefined") return;

    const interval = setInterval(() => {
      setCurrentPhotoIndex((prevIndex) =>
        prevIndex === photos.length - 1 ? 0 : prevIndex + 1
      );
    }, 6000);

    return () => clearInterval(interval);
  }, [photos.length]);

  const scrollToAbout = () => {
    // Guard against SSR
    if (typeof window === "undefined") return;

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
      <div className="bg-gradient-to-br from-blue-400 to-blue-600 py-20">
        <div className="px-10 md:px-20">
          <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-semibold text-slate-50 leading-tight">
            Hello <br />
            Friends!
          </h1>
          <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-medium text-slate-50 whitespace-nowrap cursor-pointer">
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
      <div className={`py-12 px-6 sm:px-10 lg:px-20 ${COLORS.BG_GRAY_LIGHT}`}>
        <div className="max-w-6xl mx-auto">
          <h2
            className={`text-4xl lg:text-5xl ${COLORS.TEXT_PRIMARY} font-bold text-center mb-4`}
          >
            Grocery Lists, Automated
          </h2>
          <p
            className={`text-xl ${COLORS.TEXT_SECONDARY} text-center mb-12 max-w-3xl mx-auto`}
          >
            Go from recipes to organized shopping list in seconds
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 mx-8 md:mx-0">
            {/* Step 1 */}
            <div
              className={`flex flex-col items-center ${COLORS.BG_WHITE} rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow`}
            >
              <div className="bg-blue-500 rounded-full p-4 mb-6">
                <CookingPot className="h-12 w-12 text-white" />
              </div>
              <h3
                className={`text-xl font-semibold ${COLORS.TEXT_PRIMARY} mb-3 text-center`}
              >
                Choose Your Recipes
              </h3>
              <p
                className={`${COLORS.TEXT_PRIMARY} text-center leading-relaxed`}
              >
                Browse our recipe collection or add your own favorites to plan
                your meals
              </p>
            </div>

            {/* Step 2 */}
            <div
              className={`flex flex-col items-center ${COLORS.BG_WHITE} rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow`}
            >
              <div className="bg-blue-500 rounded-full p-4 mb-6">
                <NotepadText className="h-12 w-12 text-white" />
              </div>
              <h3
                className={`text-xl font-semibold ${COLORS.TEXT_PRIMARY} mb-3 text-center`}
              >
                Generate Your List
              </h3>
              <p
                className={`${COLORS.TEXT_PRIMARY} text-center leading-relaxed`}
              >
                Automatically create a shopping list from your selected recipes
                with custom servings amounts
              </p>
            </div>

            {/* Step 3 */}
            <div
              className={`flex flex-col items-center ${COLORS.BG_WHITE} rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow`}
            >
              <div className="bg-blue-500 rounded-full p-4 mb-6">
                <LayoutGrid className="h-12 w-12 text-white" />
              </div>
              <h3
                className={`text-xl font-semibold ${COLORS.TEXT_PRIMARY} mb-3 text-center`}
              >
                Shop Efficiently
              </h3>
              <p
                className={`${COLORS.TEXT_PRIMARY} text-center leading-relaxed`}
              >
                Items organized by grocery store aisle and sub-aisle position
                for the most efficient shopping experience
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
          <h2
            className={`text-3xl lg:text-4xl font-bold ${COLORS.TEXT_PRIMARY} mb-8`}
          >
            Why Choose Cantu's Kitchen?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="text-left">
              <h3
                className={`text-xl font-semibold ${COLORS.TEXT_PRIMARY} mb-3`}
              >
                Smart Organization
              </h3>
              <p className={COLORS.TEXT_PRIMARY}>
                Ingredients automatically grouped by grocery store aisle for
                efficient shopping
              </p>
            </div>
            <div className="text-left">
              <h3
                className={`text-xl font-semibold ${COLORS.TEXT_PRIMARY} mb-3`}
              >
                Recipe Management
              </h3>
              <p className={COLORS.TEXT_PRIMARY}>
                Store and organize your favorite recipes in one convenient
                location
              </p>
            </div>
            <div className="text-left">
              <h3
                className={`text-xl font-semibold ${COLORS.TEXT_PRIMARY} mb-3`}
              >
                Flexible Serving Sizes
              </h3>
              <p className={COLORS.TEXT_PRIMARY}>
                No more math or measuring mishaps - simply select your serving
                size and we'll adjust every ingredient automatically
              </p>
            </div>
            <div className="text-left">
              <h3
                className={`text-xl font-semibold ${COLORS.TEXT_PRIMARY} mb-3`}
              >
                Time Saving
              </h3>
              <p className={COLORS.TEXT_PRIMARY}>
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
        className="py-20 px-6 sm:px-10 lg:px-20 bg-gradient-to-br from-blue-400 to-blue-600"
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-8">
            {/* Photo Slideshow - Shows on top on mobile, right side on desktop */}
            <div className="order-1 lg:order-2 flex justify-center">
              <div className="relative w-80 h-80 rounded-2xl overflow-hidden shadow-md">
                {photos.map((photo, index) => (
                  <img
                    key={index}
                    src={photo}
                    alt={`Reese photo ${index + 1}`}
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
                      index === currentPhotoIndex ? "opacity-100" : "opacity-0"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Text Content - Shows on bottom on mobile, left side on desktop */}
            <div className="order-2 lg:order-1 text-left">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-8">
                The Cantu Behind the Kitchen
              </h2>
              <p className="text-md md:text-xl text-blue-50 leading-relaxed mb-8">
                Born from my love of cooking and a desire to make meal planning
                effortless, Cantu's Kitchen helps home cooks organize their
                recipes and streamline their grocery shopping experience.
              </p>
              <p className="text-md md:text-xl text-blue-50 leading-relaxed mb-8">
                I found myself delaying my grocery trips because the barrior of
                the 20 minutes it takes to build a comprehensive list. So, I
                dedicated over two months of continuous work (plus I'll keep
                tinkering with this) in order to fix it. I hope to spare you my
                same fate.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
