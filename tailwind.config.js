/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        indigo: {
          50: '#f5f7ff',
          100: '#ebf0fe',
          200: '#dae3fd',
          300: '#bccaf9',
          400: '#93a6f4',
          500: '#6a7df0',
          600: '#4f5be7',
          700: '#4249d4',
          800: '#3a3eb0',
          900: '#33378d',
          950: '#1e2053',
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}

