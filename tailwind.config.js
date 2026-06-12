/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#10B981', // Emerald 500
          dark: '#059669',    // Emerald 600
          light: '#D1FAE5',   // Emerald 100
          bg: '#F0FDF4',      // Emerald 50
          deep: '#064E3B',    // Emerald 900
        },
        accent: {
          DEFAULT: '#F59E0B', // Amber 500
          light: '#FEF3C7',   // Amber 100
          dark: '#B45309',    // Amber 700
        },
        charcoal: {
          DEFAULT: '#1F2937', // Gray 800
          light: '#374151',   // Gray 700
          dark: '#111827',    // Gray 900
        },
        muted: '#6B7280',     // Gray 500
        lightGray: '#F3F4F6', // Gray 100
        borderColor: '#E5E7EB', // Gray 200
      },
    },
  },
  plugins: [],
}
