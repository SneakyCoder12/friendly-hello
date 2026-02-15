import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "hsl(var(--primary))",
        "primary-hover": "hsl(var(--primary-hover))",
        "background-light": "hsl(var(--background-light))",
        "background-pure": "hsl(var(--background-pure))",
        "surface-light": "hsl(var(--surface-light))",
        "surface-accent": "hsl(var(--surface-accent))",
        "text-main": "hsl(var(--text-main))",
        "text-secondary": "hsl(var(--text-secondary))",
        "accent-blue": "hsl(var(--accent-blue))",
        "border-light": "hsl(var(--border-light))",
      },
      fontFamily: {
        display: ["Montserrat", "sans-serif"],
        sans: ["Inter", "sans-serif"],
        plate: ["Inter", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
      boxShadow: {
        plate: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        card: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
        "card-hover": "0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02)",
      },
    },
  },
  plugins: [],
} satisfies Config;
