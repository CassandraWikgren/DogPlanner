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
    // Pattern matching för att fånga ALLA varianter dynamiskt
    {
      pattern: /grid-cols-(1|2|3|4|5|6|7|8|9|10|11|12)/,
      variants: ["sm", "md", "lg", "xl", "2xl"],
    },
    {
      pattern:
        /text-(emerald|blue|orange|purple|pink|amber|slate|gray|green)-(50|100|200|300|400|500|600|700|800|900)/,
    },
    {
      pattern:
        /bg-(emerald|blue|orange|purple|pink|amber|slate|gray|green)-(50|100|200|300|400|500|600|700|800|900)/,
    },
    {
      pattern:
        /border-(emerald|blue|orange|purple|pink|amber|slate|gray|green)-(50|100|200|300|400|500|600|700|800|900)/,
    },
    {
      pattern: /text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)/,
    },
    {
      pattern: /gap-(0|1|2|3|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32)/,
    },
    {
      pattern: /(w|h)-(0|1|2|3|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32)/,
    },

    // Specifika klasser som används överallt
    "bg-[#2c7a4c]",
    "hover:bg-[#236139]",
    "text-[#2c7a4c]",
    "border-[#2c7a4c]",
    "hover:border-[#2c7a4c]",
    "mb-8",
    "ml-4",
    "pt-12",
    "pb-16",
    "-mt-12",
    "mb-6",
    "p-3",
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
