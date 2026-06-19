import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'var(--border)',
        background: 'var(--bg)',
        foreground: 'var(--text)',
        muted: 'var(--muted)',
        panel: 'var(--panel)',
        accent: 'var(--accent)'
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)'
      },
      fontSize: {
        ui: ['var(--font-size-ui)', { lineHeight: 'var(--line-height-ui)' }],
        sm: ['var(--font-size-sm)', { lineHeight: '18px' }]
      }
    }
  },
  plugins: []
} satisfies Config;
