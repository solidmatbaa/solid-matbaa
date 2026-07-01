import type { Config } from "tailwindcss";

/**
 * Tailwind v4 uses @theme in src/app/globals.css as the source of truth.
 * Primary brand green matches the logo exactly: #28e19c
 */
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#ecfdf7",
          100: "#d0faea",
          200: "#a5f3d9",
          300: "#72ecc4",
          400: "#48e7ad",
          500: "#28e19c",
          600: "#22d193",
          700: "#1ab883",
          800: "#14966a",
          900: "#0f7352",
          primary: "#28e19c",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
};

export default config;
