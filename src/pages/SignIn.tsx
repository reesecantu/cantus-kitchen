import { Link } from "react-router";
import kitchen from "../assets/Chef-amico.svg";

export const SignIn = () => {
  return (
    <section className="bg-gray-100 h-screen flex flex-col md:flex-row justify-center space-y-10 md:space-y-0 md:space-x-16 items-center m-0">
      <div className="bg-slate-50 rounded-2xl shadow-2xl p-12 m-8 md:p-25 flex flex-row items-center md:items-start  w-auto max-w-5xl">
        <div className="flex-1 text-center hidden md:block mr-3">
          <img
            src={kitchen}
            alt="Kitchen"
            className="w-full h-auto max-w-md "
          />
          <a
            href="https://storyset.com/work"
            className="text-slate-400 text-xs"
          >
            Work illustrations by Storyset
          </a>
        </div>
        <div className="flex-1">
          <p>Sign in with Google</p>
          <div className="my-5 flex items-center before:mt-0.5 before:flex-1 before:border-t before:border-neutral-300 after:mt-0.5 after:flex-1 after:border-t after:border-neutral-300">
            <p className="mx-4 mb-0 text-center font-semibold text-slate-500">
              Or
            </p>
          </div>
          <input
            className="text-sm w-full px-4 py-2 border border-solid border-gray-300 rounded"
            type="text"
            placeholder="Email Address"
          />
          <input
            className="text-sm w-full px-4 py-2 border border-solid border-gray-300 rounded mt-4"
            type="password"
            placeholder="Password"
          />
          <div className="mt-4 flex flex-col sm:flex-row sm:justify-between font-semibold text-sm space-y-2 sm:space-y-0">
            <label className="flex text-slate-500 hover:text-slate-600 cursor-pointer">
              <input className="mr-1" type="checkbox" />
              <span>Remember Me</span>
            </label>
            <a className="text-blue-600 hover:text-blue-700" href="#">
              Forgot Password?
            </a>
          </div>
          <div className="text-center md:text-left">
            <button
              className="mt-4 bg-blue-600 hover:bg-blue-700 px-4 py-2 text-white uppercase rounded text-xs tracking-wider"
              type="submit"
            >
              Sign In
            </button>
          </div>
          <div className="mt-4 font-semibold text-sm text-slate-500 text-center md:text-left">
            Don&apos;t have an account?{" "}
            <Link to="/sign-up" className="text-blue-500 hover:text-blue-600">
              Sign up here
            </Link>
          </div>
          <div className=" font-semibold text-sm text-slate-500 text-center md:text-left">
            Just browsing?{" "}
            <button className="mt-2 text-blue-500 hover:text-blue-600">
              Use a guest account
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
