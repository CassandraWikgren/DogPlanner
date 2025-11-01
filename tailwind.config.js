// tailwind.config.js
module.exports = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./types/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  // SAFELIST: Använder patterns för att täcka alla hundpensionat-klasser
  safelist: [
    // Specifika klasser som MÅSTE finnas
    "grid",
    "flex",
    "flex-1",
    "flex-wrap",
    "hidden",
    "block",
    // Patterns för färger (täcker alla varianter)
    {
      pattern:
        /^(text|bg)-(emerald|blue|orange|purple|white|gray)-(50|100|200|300|400|500|600|700|800|900)$/,
    },
    // Pattern för text-white med opacity
    {
      pattern: /^text-white(\/\d+)?$/,
    },
    // Patterns för text-storlekar
    {
      pattern: /^text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl)$/,
    },
    {
      pattern: /^(sm|md|lg|xl):text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl)$/,
    },
    // Patterns för grid
    {
      pattern: /^grid-cols-\d+$/,
    },
    {
      pattern: /^(sm|md|lg|xl):grid-cols-\d+$/,
    },
    // Patterns för gap
    {
      pattern: /^gap-\d+$/,
    },
    // Patterns för margin och padding
    {
      pattern: /^(m|p)(t|b|l|r|x|y)?-\d+$/,
    },
    // Patterns för font-weight
    {
      pattern:
        /^font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)$/,
    },
    // Patterns för gradients
    {
      pattern: /^bg-gradient-to-(r|l|t|b|tr|tl|br|bl)$/,
    },
    {
      pattern: /^(from|via|to)-\[#[0-9a-fA-F]{6}\]$/,
    },
    // Patterns för width och max-width
    {
      pattern: /^(min-w|max-w|w)-\[.*\]$/,
    },
    {
      pattern: /^(min-w|max-w|w)-(full|screen|\d+)$/,
    },
    {
      pattern: /^(sm|md|lg|xl):max-w-\[.*\]$/,
    },
  ],
  theme: {
    extend: {
      colors: {
        green: {
          DEFAULT: "#2c7a4c",
          light: "#e6f4ea",
          dark: "#25663e",
        },
        bg: "#fdfdfd",
        text: "#333",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },
      },
      fontFamily: {
        sans: ['Segoe UI"', "Tahoma", "Geneva", "Verdana", "sans-serif"],
      },
      boxShadow: {
        card: "0 4px 10px rgba(0, 0, 0, 0.06)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
