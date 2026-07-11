/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        neutral: {
          50: 'var(--n-50)',
          100: 'var(--n-100)',
          200: 'var(--n-200)',
          300: 'var(--n-300)',
          400: 'var(--n-400)',
          500: 'var(--n-500)',
          600: 'var(--n-600)',
          700: 'var(--n-700)',
          800: 'var(--n-800)',
          900: 'var(--n-900)',
          950: 'var(--n-950)',
        },
        emerald: {
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
        },
        blue: {
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
        },
        red: {
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          950: '#450a0a',
        },
        amber: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        os: {
          bg: "var(--bg)",
          surface: "var(--surface)",
          border: "var(--border)",
          text: "var(--text)",
          muted: "var(--muted)",
        },
        white: 'var(--white)',
        black: 'var(--black)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};

