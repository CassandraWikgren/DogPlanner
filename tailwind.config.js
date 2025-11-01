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
  // EXPLICIT SAFELIST: Alla klasser som behövs för statistik-kort och färger
  safelist: [
    // Layout
    "grid",
    "grid-cols-1",
    "grid-cols-2",
    "grid-cols-4",
    "sm:grid-cols-2",
    "lg:grid-cols-4",
    "gap-6",
    "mb-8",
    "hidden",
    "flex",
    "flex-1",
    "flex-wrap",
    "block",
    "inline",
    "inline-block",
    // Färger för statistik-kort (text)
    "text-emerald-600",
    "text-blue-600",
    "text-orange-600",
    "text-purple-600",
    // Färger för statistik-kort (bakgrund)
    "bg-emerald-50",
    "bg-blue-50",
    "bg-orange-50",
    "bg-purple-50",
    // Text-storlekar
    "text-4xl",
    "text-sm",
    "text-xs",
    // Font-weights
    "font-bold",
    "font-medium",
    // Övriga utility-klasser
    "min-w-[280px]",
    "max-w-full",
    "sm:max-w-[calc(50%-12px)]",
    "lg:max-w-[calc(25%-18px)]",
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
