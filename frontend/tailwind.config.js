/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['"Clash Display"', '"DM Sans"', 'sans-serif'],
        body:    ['"DM Sans"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        // Midnight blue-black base with electric amber accent
        cs: {
          bg:       '#0a0b0f',
          surface:  '#111318',
          border:   '#1e2028',
          muted:    '#2a2d38',
          text:     '#e8eaf0',
          subtle:   '#6b7280',
          accent:   '#f59e0b',   // amber
          'accent-dim': '#92400e',
          blue:     '#3b82f6',
          green:    '#10b981',
          red:      '#ef4444',
          purple:   '#8b5cf6',
        }
      },
      animation: {
        'fade-up':   'fadeUp 0.4s ease forwards',
        'fade-in':   'fadeIn 0.3s ease forwards',
        'slide-in':  'slideIn 0.35s cubic-bezier(0.16,1,0.3,1) forwards',
        'pulse-dot': 'pulseDot 1.5s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeUp:   { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        fadeIn:   { from: { opacity: 0 }, to: { opacity: 1 } },
        slideIn:  { from: { opacity: 0, transform: 'translateX(-16px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
        pulseDot: { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.4 } },
      },
    },
  },
  plugins: [],
}
