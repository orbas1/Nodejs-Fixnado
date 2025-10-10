/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', 'ui-sans-serif', 'system-ui']
      },
      colors: {
        primary: '#0B1D3A',
        accent: '#1F4ED8',
        secondary: '#F4F7FA',
        success: '#00BFA6',
        danger: '#FF6B6B'
      },
      boxShadow: {
        glow: '0 12px 45px rgba(31, 78, 216, 0.15)'
      }
    }
  },
  plugins: []
};
