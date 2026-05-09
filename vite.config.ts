import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    target: "vercel",      // <-- Add this line
    server: { entry: "server" },
  },
});
