import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// مسارات نسبية عشان يشتغل من أي مكان (GitHub Pages / Netlify / أي مجلد)
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "./",
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.test.{js,jsx,ts,tsx}"],
    exclude: ["node_modules/**", "dist/**", "tests/e2e/**"],
    setupFiles: "./src/test/setup.js",
    css: false,
  },
});
