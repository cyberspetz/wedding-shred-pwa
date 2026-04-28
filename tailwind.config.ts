import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0f1114',
        card: '#1a1d23',
        'card-hover': '#21252d',
        accent: '#e85d3a',
        'accent-hover': '#d04e2c',
        green: '#3ecf8e',
        yellow: '#f5c542',
        muted: '#6b7280',
        border: '#2a2d35',
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
      },
      screens: {
        xs: '375px',
      },
    },
  },
  plugins: [],
}
export default config
