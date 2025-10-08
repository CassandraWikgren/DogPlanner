/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#2c7a4c",
        secondary: "#f4f4f4",
        accent: "#3e9b5b",
        text: "#222",
        muted: "#666",
      },
      borderRadius: {
        md: "8px",
      },
    },
  },
  plugins: [],
};
