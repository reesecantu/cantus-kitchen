import { renderToString } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Home } from "./src/pages/Home";
import "./src/index.css";
import { StaticRouter } from "react-router";

// Server-side prerendering with router context
export async function prerender() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Infinity },
    },
  });

  try {
    const html = renderToString(
      <QueryClientProvider client={queryClient}>
        <StaticRouter location="/">
          <Home />
        </StaticRouter>
      </QueryClientProvider>
    );

    queryClient.clear();

    return { html };
  } catch (error) {
    console.error("Prerender error:", error);
    return { html: "<div>Prerender failed</div>" };
  }
}
