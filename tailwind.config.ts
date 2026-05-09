import type { Config } from "tailwindcss";

// Tailwind v4 reads its config from src/styles.css via @theme.
// This file exists to satisfy tooling that expects a tailwind.config.ts.
export default {
  content: ["./src/**/*.{ts,tsx}"],
} satisfies Config;
