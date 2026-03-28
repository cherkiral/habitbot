import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
      colors: {
        bg: '#faf8f0',
        card: '#ffffff',
        sidebar: '#f3f0e4',
        hover: '#ede9d8',
        active: '#e5e0cc',
        border: '#ddd8c0',
        'border-light': '#e8e4d0',
        primary: '#2a3010',
        secondary: '#5a6e2a',
        muted: '#8a9060',
        hint: '#b0b890',
        accent: '#6a8a2a',
        'accent-dark': '#3a4a1a',
        'accent-light': '#c8e090',
        'accent-bg': '#eef4d8',
        amber: '#d97706',
        'amber-light': '#fef3c7',
      },
      borderRadius: {
        sm: '6px',
        DEFAULT: '8px',
        lg: '12px',
        xl: '16px',
      },
    },
  },
  plugins: [],
}

export default config