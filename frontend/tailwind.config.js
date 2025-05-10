/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,ts,tsx,mdx}",],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
}

