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
  safelist: [
    // Säkerställ att DogPlanner-färger alltid inkluderas
    "bg-[#2c7a4c]",
    "hover:bg-[#236139]",
    "text-[#2c7a4c]",
    "border-[#2c7a4c]",
    "hover:border-[#2c7a4c]",

    // Statistik-kort färger (ALLA varianter som används)
    "text-emerald-600",
    "bg-emerald-50",
    "text-blue-600",
    "bg-blue-50",
    "text-orange-600",
    "bg-orange-50",
    "text-purple-600",
    "bg-purple-50",
    "border-blue-500",
    "border-orange-500",
    "border-purple-500",
    "border-pink-500",
    "text-pink-600",
    "border-emerald-500",
    "border-amber-600",
    "text-amber-600",
    "border-slate-600",
    "text-slate-600",

    // Text-storlekar för statistik
    "text-4xl",
    "text-3xl",
    "text-2xl",

    // Layout och spacing
    "grid-cols-1",
    "grid-cols-2",
    "grid-cols-4",
    "sm:grid-cols-2",
    "lg:grid-cols-4",
    "md:grid-cols-5",
    "gap-6",
    "mb-8",
    "w-14",
    "h-14",
    "ml-4",

    // Knappfärger
    "bg-amber-600",
    "hover:bg-amber-700",
    "bg-emerald-600",
    "hover:bg-emerald-700",
    "bg-slate-600",
    "hover:bg-slate-700",
    "bg-gray-600",
    "hover:bg-gray-700",

    // Övriga
    "pt-12",
    "pb-16",
    "-mt-12",
    "mb-6",
    "p-3",
    "gap-3",
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
