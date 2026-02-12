/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        nw: {
          primary: '#1a365d',
          secondary: '#2d3748',
          accent: '#3182ce',
          success: '#38a169',
          warning: '#d69e2e',
          danger: '#e53e3e',
        },
      },
    },
  },
  plugins: [],
};
