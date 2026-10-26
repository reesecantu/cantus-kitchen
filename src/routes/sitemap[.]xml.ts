import { createClient } from "@supabase/supabase-js";

const BASE_URL = "https://cantuskitchen.com";

const STATIC_ROUTES = ["/", "/recipes"];

export async function loader() {
  // Cookie-less anon client: the response is publicly cached, so it must never
  // depend on the visitor's session or forward Set-Cookie headers.
  const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY as string,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
  const { data: recipes, error } = await supabase
    .from("recipes")
    .select("id, created_at")
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  // Don't serve (and cache for a day) a sitemap missing every recipe.
  if (error) {
    console.error("sitemap: failed to load public recipes", error);
    return new Response("Failed to generate sitemap", {
      status: 500,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const staticUrls = STATIC_ROUTES.map(
    (path) => `
  <url>
    <loc>${BASE_URL}${path}</loc>
    <changefreq>weekly</changefreq>
    <priority>${path === "/" ? "1.0" : "0.8"}</priority>
  </url>`
  ).join("");

  const recipeUrls = recipes
    .map(
      (r) => `
  <url>
    <loc>${BASE_URL}/recipe/${r.id}</loc>
    <lastmod>${r.created_at.slice(0, 10)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`
    )
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${staticUrls}${recipeUrls}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
