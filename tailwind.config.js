/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#B71C2C',
          hover: '#941827',
          light: '#FDF2F3',
          subtle: '#FAF0F1',
          border: '#F2C2C7',
          50: '#FDF2F3',
          100: '#FCE7E9',
          600: '#B71C2C',
          700: '#941827',
          800: '#75131E',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          subtle: '#F9FAFB',
        },
        page: '#F5F6F8',
        ink: {
          primary: '#20242B',
          secondary: '#667085',
          muted: '#98A2B3',
        },
        divider: '#E3E6EA',
        status: {
          success: '#218653',
          'success-bg': '#EAF6EE',
          warning: '#B7791F',
          'warning-bg': '#FEF7EC',
          error: '#C62828',
          'error-bg': '#FDF2F2',
          info: '#2767B1',
          'info-bg': '#EDF4FC',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'enterprise': '0 1px 3px 0 rgba(16, 24, 40, 0.06), 0 1px 2px 0 rgba(16, 24, 40, 0.04)',
        'enterprise-md': '0 4px 8px -2px rgba(16, 24, 40, 0.08), 0 2px 4px -2px rgba(16, 24, 40, 0.04)',
        'enterprise-lg': '0 12px 16px -4px rgba(16, 24, 40, 0.08), 0 4px 6px -2px rgba(16, 24, 40, 0.03)',
      }
    },
  },
  plugins: [],
}
