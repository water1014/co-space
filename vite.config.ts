import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// GitHub Pages 项目站点必须带仓库名前缀；本地 dev 用根路径。
// 仓库改名时只改 VITE_BASE_PATH（或 workflow 里的 env）即可。
const REPO = "co-space";

export default defineConfig(({ mode }) => ({
  // dev 走根路径，build / preview 走仓库前缀（preview 的 mode 也是 production）。
  base: mode === "development" ? "/" : (process.env.VITE_BASE_PATH ?? `/${REPO}/`),
  plugins: [react(), tailwindcss()],
  build: {
    target: "es2020",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          pixi: ["pixi.js"],
          assistant: ["@assistant-ui/react"],
        },
      },
    },
  },
  server: { host: "0.0.0.0", port: 5173 },
}));
