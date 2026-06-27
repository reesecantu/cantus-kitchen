import { useState } from "react";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  data,
  isRouteErrorResponse,
  useLocation,
} from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Analytics } from "@vercel/analytics/react";
import type { Route } from "./+types/root";
import "./index.css";
import { AuthProvider } from "@/features/auth/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ROUTES } from "@/utils/constants";
import { getServerClient } from "@/lib/supabase.server";

const AUTH_ROUTES = new Set<string>([
  ROUTES.SIGN_IN,
  ROUTES.SIGN_UP,
  ROUTES.FORGOT_PASSWORD,
  ROUTES.RESET_PASSWORD,
]);

export const links: Route.LinksFunction = () => [
  { rel: "icon", type: "image/png", href: "/favicon.png" },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap",
  },
];

export const meta: Route.MetaFunction = () => [
  { title: "Cantu's Kitchen | Grocery Lists, Automated" },
  {
    name: "description",
    content:
      "Generate smart grocery lists from recipes instantly. Auto-organized by aisle with flexible serving sizes. Make meal planning effortless with Cantu's Kitchen.",
  },
  {
    name: "keywords",
    content:
      "grocery list generator, recipe to shopping list, meal planning app, automatic grocery lists, ingredient calculator, grocery shopping organizer, recipe management, cooking planner",
  },
];

export async function loader({ request }: Route.LoaderArgs) {
  const { supabase, headers } = getServerClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return data({ user }, { headers });
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App({ loaderData }: Route.ComponentProps) {
  const [queryClient] = useState(() => new QueryClient());
  const location = useLocation();
  const hideNavbar = AUTH_ROUTES.has(location.pathname);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider initialUser={loaderData.user}>
        {!hideNavbar && <Navbar />}
        <div className={hideNavbar ? "min-h-screen" : "min-h-screen pt-20"}>
          <Outlet />
        </div>
        <Footer />
        <Analytics />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let title = "Something went wrong";
  let message = "An unexpected error occurred. Please try again.";

  if (isRouteErrorResponse(error)) {
    title = error.status === 404 ? "Page not found" : `Error ${error.status}`;
    message =
      error.status === 404
        ? "The page you're looking for doesn't exist or may have been moved."
        : error.statusText || message;
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-3xl font-bold text-gray-800">{title}</h1>
      <p className="text-gray-600">{message}</p>
      <a
        href="/"
        className="mt-2 rounded-lg bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
      >
        Back to home
      </a>
    </main>
  );
}
