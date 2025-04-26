/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          primary: '#4f46e5',
          secondary: '#0ea5e9',
          accent: '#f97316',
        },
      },
    },
    plugins: [],
  }