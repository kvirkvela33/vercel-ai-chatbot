const { fontFamily } = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'], // Required for class-based dark mode
  content: ['app/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px'
      }
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', ...fontFamily.sans]
      },
      colors: {
        background: '#202123', // Background of the whole page
        inputBg: '#40414f',    // Input box background
        inputBorder: '#4b4b4e',
        surface: '#444654',     // Assistant bubble background
        surfaceUser: '#2f81f7', // User message bubble
        accent: '#2f81f7',      // Buttons
        hoverAccent: '#1a73e8', // Button hover
        placeholder: '#a0a0a0', // Input placeholder text
        border: '#3c3f4a',
        ring: '#5b5f6b',
        muted: '#777',
        white: '#ffffff',
        black: '#000000'
      },
      borderRadius: {
        lg: '1rem',
        md: '0.5rem',
        sm: '0.25rem'
      },
      keyframes: {
        'accordion-down': {
          from: { height: 0 },
          to: { height: 'var(--radix-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: 0 }
        },
        'slide-from-left': {
          '0%': {
            transform: 'translateX(-100%)'
          },
          '100%': {
            transform: 'translateX(0)'
          }
        },
        'slide-to-left': {
          '0%': {
            transform: 'translateX(0)'
          },
          '100%': {
            transform: 'translateX(-100%)'
          }
        }
      },
      animation: {
        'slide-from-left':
          'slide-from-left 0.3s cubic-bezier(0.82, 0.085, 0.395, 0.895)',
        'slide-to-left':
          'slide-to-left 0.25s cubic-bezier(0.82, 0.085, 0.395, 0.895)',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out'
      }
    }
  },
  plugins: [
    require('tailwindcss-animate'),
    require('@tailwindcss/typography')
  ]
};