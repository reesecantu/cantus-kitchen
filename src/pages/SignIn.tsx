import { Link, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import chef from "../assets/chef-blue.svg";
import { useAuth } from "../contexts/AuthContext";

export const SignIn = () => {
  const { signInWithGoogle, signInWithEmail, signInAnonymously } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).signInWithGoogle = async (response: {
      credential: string;
    }) => {
      try {
        await signInWithGoogle(response);
        navigate("/");
      } catch (error) {
        console.error("Google sign-in failed:", error);
      }
    };

    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (window as any).signInWithGoogle;
    };
  }, [signInWithGoogle, navigate]);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmail(email, password);
      navigate("/");
    } catch (error) {
      console.error("Email sign-in failed:", error);
    }
  };

  return (
    <section className="bg-gray-100 h-screen flex flex-col md:flex-row justify-center space-y-10 md:space-y-0 md:space-x-16 items-center m-0">
      <div className="bg-slate-50 rounded-2xl shadow-2xl p-12 m-8 md:p-25 flex flex-row items-center md:items-start  w-auto max-w-5xl">
        <div className="flex-1 text-center hidden md:block mr-3">
          <img src={chef} alt="Kitchen" className="w-full max-w-md " />
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
            data-context="signin"
            data-ux_mode="popup"
            data-callback="signInWithGoogle"
            data-auto_prompt="false"
            data-use_fedcm_for_prompt="true"
          ></div>

          <div
            className="g_id_signin"
            data-type="standard"
            data-shape="rectangular"
            data-theme="filled_blue"
            data-text="signin_with"
            data-size="large"
            data-logo_alignment="left"
          ></div>
          <div className="my-5 flex items-center before:mt-0.5 before:flex-1 before:border-t before:border-neutral-300 after:mt-0.5 after:flex-1 after:border-t after:border-neutral-300">
            <p className="mx-4 mb-0 text-center font-semibold text-slate-500">
              Or
            </p>
          </div>

          <form onSubmit={handleEmailSignIn}>
            <input
              className="text-sm w-full px-4 py-2 border border-solid border-gray-300 rounded"
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              className="text-sm w-full px-4 py-2 border border-solid border-gray-300 rounded mt-4"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
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
          </form>

          <div className="mt-4 font-semibold text-sm text-slate-500 text-center md:text-left">
            Don&apos;t have an account?{" "}
            <Link to="/sign-up" className="text-blue-500 hover:text-blue-600">
              Sign up here
            </Link>
          </div>
          <div className=" font-semibold text-sm text-slate-500 text-center md:text-left">
            Just browsing?{" "}
            <button
              className="mt-2 text-blue-500 hover:text-blue-600 hover:cursor-pointer"
              onClick={async () => {
                try {
                  await signInAnonymously();
                  navigate("/");
                } catch (error) {
                  console.error("Anonymous sign-in failed:", error);
                }
              }}
            >
              Use a guest account
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
