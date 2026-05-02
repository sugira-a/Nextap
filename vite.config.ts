import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/_/backend/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/_\/backend/, ""),
      },
      "/_/backend/health": {
        target: "http://localhost:5000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/_\/backend/, ""),
      },
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/health": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
    hmr: {
      overlay: false,
    },
    // Dev-only middleware to stub extension endpoints that hit the frontend
    // (some browser extensions POST to /api/ext/* on the page origin, causing
    // noisy 404s during local development). Return 204 for these to silence
    // console noise.
    middlewareMode: false,
    // Use a small plugin via `configureServer` instead of adding middleware
    // here because Vite's `server` field doesn't accept a direct function.
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    mode === "development" && {
      name: 'dev-ext-stub',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          try {
            if (req.url && req.url.startsWith('/api/ext/')) {
              res.statusCode = 204;
              res.end();
              return;
            }
          } catch (e) {
            // ignore
          }
          next();
        });
      }
    }
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
  build: {
    rollupOptions: {
      output: {
        inlineDynamicImports: false,
      },
    },
  },
}));
