import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { vitePrerenderPlugin } from "vite-prerender-plugin";

// Plugin to force process exit after build (fixes React 19 hanging issue)
function closePlugin() {
  return {
    name: "close-plugin",
    closeBundle() {
      process.exit(0);
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    vitePrerenderPlugin({ renderTarget: "#root" }),
    closePlugin(), 
  ],
});
