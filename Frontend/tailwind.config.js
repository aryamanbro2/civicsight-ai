// tailwind.config.js
const colors = require('tailwindcss/colors');

module.exports = {
  content: [
    './App.tsx',
    './src/**/*.{js,jsx,ts,tsx}', // Watch all files in src
  ],
  theme: {
    extend: {
      colors: {
        // As per your Design System
        background: {
          DEFAULT: '#1e1e2d', // Dark background
          light: '#2a2a41', // Lighter variant for cards
        },
        primary: {
          DEFAULT: '#7c3aed', // Purple
          light: '#a881f5',
          dark: '#612dbb',
        },
        secondary: {
          DEFAULT: '#eab308', // Yellow
        },
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        // Text colors
        text: {
          DEFAULT: '#f8fafc', // Default (almost white)
          dim: '#a1a1aa', // Dimmer text
        },
      },
    },
  },
  plugins: [],
};