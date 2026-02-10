/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mandala: {
          bg: '#050510',
          gold: '#FFD700',
          orbit: 'rgba(255, 255, 255, 0.1)',
        }
      }
    },
  },
  plugins: [],
}
