/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
        secondary: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
        },
        bbc: {
          red: '#B80000',
          black: '#000000',
          white: '#FFFFFF',
          grey: {
            light: '#F5F5F5',
            DEFAULT: '#B1B3B6',
            dark: '#3A3A3A',
          },
        },
      },
      fontFamily: {
        sans: [
          'BBC Reith Sans',
          'Arial',
          'Helvetica',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};
