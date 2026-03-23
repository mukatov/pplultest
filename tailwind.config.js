/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        geist: ['Geist', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        // Figma design system
        surface: '#262626',
        border: '#404040',
        fg: '#fafafa',
        'fg-muted': '#a3a3a3',
        'primary-bg': '#f5f5f5',
        'primary-text': '#0a0a0a',
        'outline-bg': 'rgba(255,255,255,0.05)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      fontSize: {
        'h1': ['3rem', { lineHeight: '3rem', letterSpacing: '-0.09375rem', fontWeight: '600' }],
        'h2': ['1.875rem', { lineHeight: '1.875rem', letterSpacing: '-0.0625rem', fontWeight: '600' }],
        'h4': ['1.25rem', { lineHeight: '1.5rem', letterSpacing: '0', fontWeight: '600' }],
        'caption': ['0.875rem', { lineHeight: '1.3125rem', letterSpacing: '0.09375rem' }],
      },
    },
  },
  plugins: [],
}
