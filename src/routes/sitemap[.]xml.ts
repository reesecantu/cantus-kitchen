import { createSupabaseAdminClient } from "@/server/supabase-admin.server";

const BASE_URL = "https://cantuskitchen.com";
const PUBLIC_CATALOG_USER_ID = "6e0258f5-c980-47d2-a7ee-981e76e56333";

const STATIC_ROUTES = ["/", "/recipes"];

export async function loader() {
  const admin = createSupabaseAdminClient();
  const { data: recipes } = await admin
    .from("recipes")
    .select("id, created_at")
    .eq("created_by", PUBLIC_CATALOG_USER_ID)
    .order("created_at", { ascending: false });

  const staticUrls = STATIC_ROUTES.map(
    (path) => `
  <url>
    <loc>${BASE_URL}${path}</loc>
    <changefreq>weekly</changefreq>
    <priority>${path === "/" ? "1.0" : "0.8"}</priority>
  </url>`
  ).join("");

  const recipeUrls = (recipes ?? [])
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
