import kitchen from "../assets/kitchen-amber.svg";

export const Home = () => {
  return (
    <div className="bg-blue-500 flex flex-col md:flex-row">
      {/* Text Content */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-10 lg:px-20 py-12 lg:py-0">
        <h1 className="text-6xl sm:text-7xl lg:text-8xl xl:text-9xl font-semibold text-white leading-tight">
          Hello <br />
          Friends!
        </h1>
        <p className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-medium text-white whitespace-nowrap">
          Welcome to <span className="italic">Cantu's Kitchen</span>
        </p>
      </div>

      {/* Image Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-14 py-10 lg:py-0">
        <img
          src={kitchen}
          alt="Illustration of a kitchen workspace with cooking utensils"
          className="w-full max-w-xl h-auto"
        />
        <p className="text-gray-200 text-[0.65rem] md:text-xs mb-4 -mt-8 text-center">
          <a
            href="https://storyset.com/work"
            className="hover:text-white transition-colors underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Work illustrations by Storyset
          </a>
        </p>
      </div>
    </div>
  );
};
