/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        marine: '#1B3A5C',
        duret: {
          50: '#fff5ec',
          100: '#ffe8d3',
          200: '#ffd0a5',
          300: '#ffb26d',
          400: '#ffa154',
          500: '#ff8c33',
          600: '#FF7900',
          700: '#e66800',
          800: '#bf5300',
          900: '#994400',
        }
      }
    },
  },
  plugins: [],
}
