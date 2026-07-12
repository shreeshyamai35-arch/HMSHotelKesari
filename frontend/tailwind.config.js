/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Kesari Hospitality Suite design tokens
        surface: {
          DEFAULT: '#f8f9ff',
          dim: '#cbdbf5',
          bright: '#f8f9ff',
          lowest: '#ffffff',
          low: '#eff4ff',
          container: '#e5eeff',
          high: '#dce9ff',
          highest: '#d3e4fe',
          variant: '#d3e4fe',
        },
        'on-surface': '#0b1c30',
        'on-surface-variant': '#45464d',
        navy: {
          DEFAULT: '#131b2e',
          deep: '#0b1c30',
        },
        primary: {
          DEFAULT: '#131b2e',
          fg: '#ffffff',
          container: '#dae2fd',
        },
        gold: {
          DEFAULT: '#7c580f',
          fg: '#ffffff',
          container: '#ffcc7a',
          light: '#f0bf6e',
        },
        outline: {
          DEFAULT: '#76777d',
          variant: '#c6c6cd',
        },
        success: '#2e7d32',
        warning: '#b8860b',
        danger: '#ba1a1a',
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        sm: '0.125rem',
        DEFAULT: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '9999px',
      },
      boxShadow: {
        ambient: '0px 4px 20px rgba(15, 23, 42, 0.08)',
      },
      maxWidth: {
        container: '1440px',
      },
      spacing: {
        sidebar: '260px',
      },
    },
  },
  plugins: [],
};
