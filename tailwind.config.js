import flowbite from 'flowbite/plugin';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,html}', './node_modules/flowbite/**/*.js'],
  theme: {
    extend: {
      colors: {
        ceb: {
          blue: '#2574BB',
          sky: '#06A7E0',
          green: '#039482',
          yellow: '#F7D117',
          'yellow-hover': '#E8C40F',
          navy: '#1A4A7A',
          muted: '#F5F7FA',
          text: '#1F2937',
          'text-muted': '#6B7280',
          border: '#E5E7EB',
        },
      },
      fontFamily: {
        sans: ['Nunito', 'system-ui', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [flowbite],
};
