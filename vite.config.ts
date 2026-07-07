import { defineConfig } from "vite";

export default defineConfig({
  plugins: [],
  server: {
    port: 3000,
    open: true,
    host: "0.0.0.0",
    allowedHosts: ["frp-oil.com"],
  },
  build: {
    target: "esnext",
  },
});
