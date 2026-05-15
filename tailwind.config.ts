import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        bg: "#071014",
        surface: "#0d171f",
        surface2: "#13232d",
        border: "#25414b",
        aqua: "#50e3c2",
        gold: "#f4c95d",
        coral: "#ff6b6b"
      },
      boxShadow: {
        softGlow: "0 20px 70px rgba(80, 227, 194, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
