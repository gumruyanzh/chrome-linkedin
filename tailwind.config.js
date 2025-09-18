/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{html,js,jsx,ts,tsx}",
    "./src/popup/**/*.{html,js}",
    "./src/dashboard/**/*.{html,js}",
    "./src/settings/**/*.{html,js}"
  ],
  theme: {
    extend: {
      colors: {
        linkedin: {
          blue: '#0073b1',
          lightblue: '#004182',
          darkblue: '#00344c'
        }
      },
      fontFamily: {
        'sans': ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif']
      }
    },
  },
  plugins: [],
  // Ensure compatibility with Chrome extension environment
  corePlugins: {
    preflight: false, // Disable CSS reset in content scripts
  }
}