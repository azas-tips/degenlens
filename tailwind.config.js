/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.html",
  ],
  theme: {
    extend: {
      colors: {
        // Degen-themed colors
        primary: {
          DEFAULT: '#8B5CF6',
          light: '#A855F7',
          dark: '#7C3AED',
        },
        accent: {
          green: '#39FF14',
          neon: '#39FF14',
        },
        profit: '#10B981',
        loss: '#EF4444',
        dark: {
          DEFAULT: '#0F0F0F',
          lighter: '#1A1A1A',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
