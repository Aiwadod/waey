import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// مسارات نسبية عشان يشتغل من أي مكان (GitHub Pages / Netlify / أي مجلد)
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "./",
});
