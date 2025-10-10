/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', 'ui-sans-serif', 'system-ui']
      },
      colors: {
        primary: '#0E1C36',
        accent: '#00A1E0',
        secondary: '#F4F7FA',
        success: '#00BFA6',
        danger: '#FF6B6B'
      },
      boxShadow: {
        glow: '0 10px 50px rgba(0, 161, 224, 0.15)'
      }
    }
  },
  plugins: []
};
