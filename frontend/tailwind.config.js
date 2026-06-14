/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        os: {
          bg: "#0a0a0a",
          surface: "#171717",
          border: "#262626",
          text: "#e5e5e5",
          muted: "#a3a3a3",
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};

