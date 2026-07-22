/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primaryDark: '#1A3D2B',
        primaryMid: '#2D5A3D',
        accentGreen: '#2D7A4F',
        accentGold: '#C4A24A',
        strategyQAW: '#1A3D2B',
        strategyQTF: '#5C1A1A',
        strategyQGF: '#1A2540',
        positive: '#16A34A',
        negative: '#DC2626',
        background: '#EDE8DC',
        surface: '#F5F2EC',
        border: '#D6D0C4',
        textPrimary: '#1C1C1C',
        textSecondary: '#6B6B6B',
        navActiveBg: '#F0EDE4',
        lightGreen: '#D1FAE5',
        lightRed: '#FEE2E2',
      },
    },
  },
  plugins: [],
};
