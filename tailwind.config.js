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
        'deep': '#09090B',
        'secondary': '#18181B',
        'accent-muted': '#A1A1AA', // Zinc-400 for neutral contrast
        'accent-light': '#3B82F6', // Vibrant Electric Blue
        'accent-alt': '#8B5CF6' // Electric Purple
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 10px rgba(223, 208, 184, 0.2), 0 0 20px rgba(223, 208, 184, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(223, 208, 184, 0.6), 0 0 30px rgba(223, 208, 184, 0.4)' }
        }
      }
    },
  },
  plugins: [],
}
