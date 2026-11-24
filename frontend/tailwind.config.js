/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f7ff",
          100: "#e0effe",
          200: "#b9ddfd",
          300: "#7cc1fb",
          400: "#36a1f7",
          500: "#0c83eb",
          600: "#0267c8",
          700: "#0352a1",
          800: "#074684",
          900: "#0c3b6e",
          950: "#082548",
        },
        verified: {
          light: "#ecfdf5",
          DEFAULT: "#059669",
          dark: "#065f46"
        },
        safety: {
          light: "#fffbeb",
          DEFAULT: "#d97706",
          dark: "#92400e"
        }
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Noto Sans Kannada",
          "Noto Sans Devanagari",
          "sans-serif"
        ]
      }
    },
  },
  plugins: [],
}
