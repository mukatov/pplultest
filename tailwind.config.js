/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        general: {
          primary: '#171717',
          secondary: '#262626',
          foreground: '#fafafa',
          'primary-foreground': '#0a0a0a',
          'secondary-light': '#f5f5f5',
          accent: '#171717',
        },
      },
      fontFamily: {
        sans: ['Geist', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '24px',
      },
    },
  },
  plugins: [],
}
