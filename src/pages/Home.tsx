// import kitchen from "../assets/kitchen-amber.svg";

import { Testimonials } from "../components/Testimonials";

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
      {/* First Block */}
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
        </div>
      </div>

      <Testimonials />

      {/* about section */}
      <div
        id="about-section"
        className="py-40 flex px-6 sm:px-10 lg:px-20 justify-center text-amber-400 font-bold text-4xl text-center"
      >
        about section coming soon!
      </div>
    </div>
  );
};
