/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          green: '#00D09C',
        },
        logo: {
          green: '#08F6B6',
        },
        brand: {
          blue: '#5367F5',
        },
        accent: {
          'blue-light': '#B1D0FB',
          'blue-lightest': '#E5F4FD',
        },
        bg: {
          white: '#FFFFFF',
          surface: '#F5F5F5',
          'surface-dark': '#EBEBEB',
        },
        text: {
          primary: '#1C1C1C',
          secondary: '#7C7E8C',
        },
        positive: '#00D09C',
        negative: '#EB5B3C',
        warning: '#F5A623',
        gold: '#F5A623',
      },
      fontFamily: {
        sans: [
          '"DM Sans"',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
      borderRadius: {
        card: '12px',
      },
      boxShadow: {
        card: '0 2px 8px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 4px 16px rgba(0, 0, 0, 0.10)',
      },
      maxWidth: {
        app: '1000px',
        content: '800px',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 220ms ease-out both',
      },
    },
  },
  plugins: [],
};
