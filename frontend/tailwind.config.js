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
          DEFAULT: '#033c63',
          light: '#0b4f80',
          lighter: '#5c82a7',
          dark: '#022a45',
          contrast: '#ffffff',
        },
        surface: {
          DEFAULT: '#ffffff',
          soft: '#f7faff',
          muted: '#e7eff8',
        },
      },
    },
  },
  plugins: [],
}