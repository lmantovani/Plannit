/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#fdf8f0', 100: '#faefd8', 200: '#f4d9a0',
          300: '#ecc060', 400: '#e3a030', 500: '#c8841a',
          600: '#a66a12', 700: '#85520e', 800: '#653e0b', 900: '#4a2d08',
        },
        stone: {
          50: '#fafaf9', 100: '#f5f5f3', 200: '#e8e7e4',
          300: '#d4d3cf', 400: '#a8a7a2', 500: '#78776f',
          600: '#5c5b55', 700: '#3f3e39', 800: '#282722', 900: '#161511',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'card-hover': '0 4px 12px 0 rgb(0 0 0 / 0.08)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}
