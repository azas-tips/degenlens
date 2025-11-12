/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.html",
  ],
  theme: {
    extend: {
      colors: {
        // Cyber/Neon color palette
        primary: {
          DEFAULT: '#8B5CF6',
          light: '#A855F7',
          dark: '#7C3AED',
        },
        neon: {
          purple: '#BD00FF',
          pink: '#FF006E',
          cyan: '#00F0FF',
          green: '#39FF14',
          blue: '#0080FF',
        },
        cyber: {
          dark: '#0A0A0F',
          darker: '#050508',
          card: '#12121A',
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
      animation: {
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'neon-flicker': 'neon-flicker 3s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'slide-in': 'slide-in 0.3s ease-out',
        'fade-in': 'fade-in 0.5s ease-out',
        'gradient-shift': 'gradient-shift 8s ease infinite',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': {
            boxShadow: '0 0 10px rgba(139, 92, 246, 0.3), 0 0 20px rgba(139, 92, 246, 0.2)',
          },
          '50%': {
            boxShadow: '0 0 15px rgba(139, 92, 246, 0.5), 0 0 30px rgba(139, 92, 246, 0.3)',
          },
        },
        'neon-flicker': {
          '0%, 19%, 21%, 23%, 25%, 54%, 56%, 100%': {
            opacity: '1',
          },
          '20%, 24%, 55%': {
            opacity: '0.8',
          },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'slide-in': {
          '0%': {
            transform: 'translateY(20px)',
            opacity: '0',
          },
          '100%': {
            transform: 'translateY(0)',
            opacity: '1',
          },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'gradient-shift': {
          '0%, 100%': {
            backgroundPosition: '0% 50%',
          },
          '50%': {
            backgroundPosition: '100% 50%',
          },
        },
      },
      backgroundSize: {
        'gradient-animate': '200% 200%',
      },
      boxShadow: {
        'neon-purple': '0 0 10px rgba(139, 92, 246, 0.3), 0 0 20px rgba(139, 92, 246, 0.2)',
        'neon-green': '0 0 10px rgba(57, 255, 20, 0.3), 0 0 20px rgba(57, 255, 20, 0.2)',
        'neon-cyan': '0 0 10px rgba(0, 240, 255, 0.3), 0 0 20px rgba(0, 240, 255, 0.2)',
        'neon-pink': '0 0 10px rgba(255, 0, 110, 0.3), 0 0 20px rgba(255, 0, 110, 0.2)',
        'cyber-card': '0 8px 32px 0 rgba(139, 92, 246, 0.1)',
      },
    },
  },
  plugins: [],
}
