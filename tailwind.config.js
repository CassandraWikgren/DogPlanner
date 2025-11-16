// tailwind.config.js
module.exports = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: [
    "text-white",
    "text-emerald-600",
    "bg-emerald-600",
    "bg-[#2c7a4c]",
    "text-4xl",
    "flex",
    "grid",
    "text-gray-900",
    "bg-gray-200",
    "hover:bg-green-700",
    "hover:bg-amber-700",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2c7a4c",
          dark: "#236139",
          light: "#3d9960",
          50: "#f0f9f4",
          100: "#dcf2e4",
          200: "#bce5cd",
          300: "#8dd3ad",
          400: "#5cba87",
          500: "#3d9960",
          600: "#2c7a4c",
          700: "#236139",
          800: "#1e4f2f",
          900: "#1a4128",
        },
      },
    },
  },
  plugins: [],
};
