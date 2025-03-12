/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{html,js,svelte,ts}',
    "./node_modules/flowbite-svelte/**/*.{html,js,svelte,ts}",
  ],
  theme: {
    extend: {
      gridTemplateColumns: {
        // Simple 8-12 column grid
        '8': 'repeat(8, minmax(0, 1fr))',
        '9': 'repeat(9, minmax(0, 1fr))',
        '10': 'repeat(10, minmax(0, 1fr))',
        '11': 'repeat(11, minmax(0, 1fr))',
        '12': 'repeat(12, minmax(0, 1fr))',
      }
    },
    borderRadius: {
      'xl': '2.5rem',
      'full': '9999px',
      'xxl': '6rem',
    }
  },
  plugins: [
    require('flowbite/plugin')
  ]
};