/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        zentry: ['zentry', 'sans-serif'],
        'circular-web': ['circular-web', 'sans-serif'],
        'space-grotesk': ['space-grotesk', 'sans-serif'],
        'poppins': ['poppins', 'sans-serif']
      },
    },
  },
  plugins: [],
}