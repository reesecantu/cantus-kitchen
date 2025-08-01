import { Link } from "react-router";
import chef from "../assets/chef-blue.svg";

export const SignUp = () => (
    <section className="bg-gray-100 h-screen flex flex-col md:flex-row justify-center space-y-10 md:space-y-0 md:space-x-16 items-center m-0">
        <div className="bg-slate-50 rounded-2xl shadow-2xl p-12 m-8 md:p-25 flex flex-row items-center md:items-start  w-auto max-w-5xl">
            <div className="flex-1 text-center hidden md:block mr-3">
                <img src={chef} alt="Kitchen" className="w-full h-auto max-w-md " />
                <a
                    href="https://storyset.com/work"
                    className="text-slate-400 text-xs"
                >
                    Work illustrations by Storyset
                </a>
            </div>
            <div className="flex-1">
                <script src="https://accounts.google.com/gsi/client" async></script>
                <div
                    id="g_id_onload"
                    data-client_id="262316464839-uc3ev77rilr4dh04lo2m1b9un5aia081.apps.googleusercontent.com"
                    data-context="signup"
                    data-ux_mode="popup"
                    data-callback="signInWithGoogle"
                    data-auto_prompt="false"
                ></div>

                <div
                    className="g_id_signin"
                    data-type="standard"
                    data-shape="rectangular"
                    data-theme="filled_blue"
                    data-text="signup_with"
                    data-size="large"
                    data-logo_alignment="left"
                ></div>
                <div className="my-5 flex items-center before:mt-0.5 before:flex-1 before:border-t before:border-neutral-300 after:mt-0.5 after:flex-1 after:border-t after:border-neutral-300">
                    <p className="mx-4 mb-0 text-center font-semibold text-slate-500">
                        Or
                    </p>
                </div>
                <input
                    className="text-sm w-full px-4 py-2 border border-solid border-gray-300 rounded"
                    type="text"
                    placeholder="Email Address" />
                <input
                    className="text-sm w-full px-4 py-2 border border-solid border-gray-300 rounded mt-4"
                    type="password"
                    placeholder="Password" />
                <div className="text-center md:text-left">
                    <button
                        className="mt-4 bg-blue-600 hover:bg-blue-700 px-4 py-2 text-white uppercase rounded text-xs tracking-wider"
                        type="submit"
                    >
                        Sign Up
                    </button>
                </div>
                <div className="mt-4 font-semibold text-sm text-slate-500 text-center md:text-left">
                    Already have an account?{" "}
                    <Link
                        to="/sign-in"
                        className="text-blue-500 hover:text-blue-600"
                        onClick={() => window.location.href = "/sign-in"}
                    >
                        Sign in here
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
