/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--app-border) / <alpha-value>)',
        input: 'hsl(var(--app-input) / <alpha-value>)',
        ring: 'hsl(var(--app-ring) / <alpha-value>)',
        background: 'hsl(var(--app-background) / <alpha-value>)',
        foreground: 'hsl(var(--app-foreground) / <alpha-value>)',
        primary: {
          DEFAULT: 'hsl(var(--app-primary) / <alpha-value>)',
          foreground: 'hsl(var(--app-primary-foreground) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'hsl(var(--app-secondary) / <alpha-value>)',
          foreground: 'hsl(var(--app-secondary-foreground) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'hsl(var(--app-muted) / <alpha-value>)',
          foreground: 'hsl(var(--app-muted-foreground) / <alpha-value>)',
        },
        card: {
          DEFAULT: 'hsl(var(--app-card) / <alpha-value>)',
          foreground: 'hsl(var(--app-card-foreground) / <alpha-value>)',
        },
      },
      borderRadius: {
        lg: '0.85rem',
        md: '0.65rem',
        sm: '0.45rem',
      },
      boxShadow: {
        glass: '0 16px 40px rgba(0, 0, 0, 0.32)',
        'neon-cyan': '0 0 15px rgba(6, 182, 212, 0.4), inset 0 0 15px rgba(6, 182, 212, 0.1)',
        'neon-orange': '0 0 15px rgba(249, 115, 22, 0.4), inset 0 0 15px rgba(249, 115, 22, 0.1)',
        'neon-purple': '0 0 15px rgba(168, 85, 247, 0.4), inset 0 0 15px rgba(168, 85, 247, 0.1)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.03)' },
        },
      },
      animation: {
        float: 'float 4s ease-in-out infinite',
        'pulse-slow': 'pulse-slow 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
