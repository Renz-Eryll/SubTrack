import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // In dev the Express API runs separately; on Vercel both share one domain.
    proxy: { "/api": "http://localhost:5500" },
  },
});
