/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        praxis: {
          yellow: '#FFCC00',
          'yellow-dark': '#E6B800',
          'yellow-light': '#FFF4CC',
          grey: '#374151',
          'grey-light': '#6B7280',
          'grey-dark': '#1F2937'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      }
    },
  },
  plugins: [],
}