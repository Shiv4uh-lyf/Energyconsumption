/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // EnerSight color system
        graphite: {
          950: '#07090f',
          900: '#0F1117',
          800: '#161b27',
          700: '#1e2535',
          600: '#252f42',
          500: '#2e3a52',
        },
        teal: {
          DEFAULT: '#00D4B1',
          50: '#e6fdf9',
          100: '#b3f7ee',
          200: '#66eedc',
          300: '#33e5cf',
          400: '#00dbbf',
          500: '#00D4B1',
          600: '#00aa8e',
          700: '#007f6a',
          800: '#005547',
          900: '#002a23',
        },
        amber: {
          DEFAULT: '#F59E0B',
          400: '#fbbf24',
          500: '#F59E0B',
          600: '#d97706',
        },
        danger: '#ef4444',
        success: '#22c55e',
        warn: '#f97316',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        'graphite-radial': 'radial-gradient(ellipse at 50% 0%, #161b27 0%, #0F1117 60%, #07090f 100%)',
        'teal-glow': 'radial-gradient(ellipse at center, rgba(0,212,177,0.15) 0%, transparent 70%)',
        'amber-glow': 'radial-gradient(ellipse at center, rgba(245,158,11,0.12) 0%, transparent 70%)',
      },
      boxShadow: {
        'teal-sm': '0 0 8px rgba(0,212,177,0.25)',
        'teal-md': '0 0 20px rgba(0,212,177,0.3)',
        'teal-lg': '0 0 40px rgba(0,212,177,0.2)',
        'glass': '0 8px 32px rgba(0,0,0,0.4)',
        'panel': '0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'pulse-teal': 'pulse-teal 2s cubic-bezier(0.4,0,0.6,1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'slide-up': 'slide-up 0.5s ease-out',
        'fade-in': 'fade-in 0.4s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
        'scan-line': 'scan-line 4s linear infinite',
      },
      keyframes: {
        'pulse-teal': {
          '0%,100%': { opacity: '1', boxShadow: '0 0 8px rgba(0,212,177,0.4)' },
          '50%': { opacity: '0.7', boxShadow: '0 0 20px rgba(0,212,177,0.2)' },
        },
        'float': {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'scan-line': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
      },
    },
  },
  plugins: [],
};
