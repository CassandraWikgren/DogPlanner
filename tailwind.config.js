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
    extend: {},
  },
  plugins: [],
};
