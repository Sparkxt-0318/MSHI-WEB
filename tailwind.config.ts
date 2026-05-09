import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{ts,tsx,mdx}',
    './content/**/*.{md,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        paper: '#FAF8F5',
        ink: {
          DEFAULT: '#0E1116',
          soft: '#3A4048',
        },
        rule: '#C8CCD2',
        accent: {
          DEFAULT: '#A4221A',
          pale: '#F4C2A8',
        },
        bedrock: {
          blue: '#3F7CAB',
          'blue-dark': '#1F4068',
          good: '#2C5F2D',
          warn: '#B85C00',
        },
        cream: '#F8F4EE',
      },
      fontFamily: {
        serif: ['Georgia', 'Times New Roman', 'serif'],
        sans: ['Calibri', 'Segoe UI', 'system-ui', 'sans-serif'],
        mono: ['SF Mono', 'Menlo', 'Consolas', 'monospace'],
      },
      fontSize: {
        // research-typography scale
        'research-meta': ['0.6875rem', { lineHeight: '1.2', letterSpacing: '0.05em' }],
        'research-body': ['0.95rem', { lineHeight: '1.6' }],
        'research-h3': ['1.5rem', { lineHeight: '1.3' }],
        'research-h2': ['2.25rem', { lineHeight: '1.2' }],
        'research-h1': ['3.5rem', { lineHeight: '1.05', letterSpacing: '-0.01em' }],
        'research-display': ['5rem', { lineHeight: '1', letterSpacing: '-0.02em' }],
      },
      maxWidth: {
        prose: '65ch',
        narrow: '50ch',
      },
      letterSpacing: {
        meta: '0.05em',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-slow': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'fade-in': 'fade-in 200ms ease-out forwards',
        'fade-in-slow': 'fade-in-slow 600ms ease-out forwards',
      },
    },
  },
  plugins: [],
};

export default config;
