import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef7ff",
          100: "#d9edff",
          200: "#bce0ff",
          300: "#8ecdff",
          400: "#59b0ff",
          500: "#3390ff",
          600: "#0b6bcb",
          700: "#0a57a3",
          800: "#0d4985",
          900: "#0f3f6e",
          950: "#082a4a"
        },
        aqua: {
          400: "#3fd6c8",
          500: "#00a99d",
          600: "#00897f",
          700: "#086d66"
        }
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
