import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// مسارات نسبية عشان يشتغل من أي مكان (GitHub Pages / Netlify / أي مجلد)
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    rolldownOptions: {
      output: {
        // نقسم مكتبات الطرف الثالث إلى أجزاء مستقلة حتى لا يتجاوز أي ملف 500KB —
        // أول زيارة تحمّل أجزاء أصغر متوازية، والمتصفح يكيّش المكتبات بمعزل عن كود التطبيق.
        codeSplitting: {
          groups: [
            { name: "react", test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
            { name: "motion", test: /node_modules[\\/](framer-motion|motion-dom|motion-utils|gsap)[\\/]/ },
            { name: "vendor", test: /node_modules[\\/]/ },
          ],
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.test.{js,jsx,ts,tsx}", "api/**/*.test.{js,ts}"],
    exclude: ["node_modules/**", "dist/**", "tests/e2e/**"],
    setupFiles: "./src/test/setup.js",
    css: false,
  },
});
