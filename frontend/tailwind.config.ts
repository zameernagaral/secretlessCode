import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--color-background)',
        surface: 'var(--color-surface)',
        text: 'var(--color-ink)',
        ink: 'var(--color-ink)',
        muted: 'var(--color-muted-ink)',
        'muted-ink': 'var(--color-muted-ink)',
        border: 'var(--color-rule)',
        rule: 'var(--color-rule)',
        signal: 'var(--color-signal)',
        accent: 'var(--color-signal)',
      },
      fontFamily: {
        heading: ['var(--font-display)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        sharp: 'var(--radius-sharp)',
        sm: 'var(--radius-sm)',
        card: 'var(--radius-card)',
      },
      spacing: {
        1: 'var(--space-1)',
        2: 'var(--space-2)',
        3: 'var(--space-3)',
        4: 'var(--space-4)',
        5: 'var(--space-5)',
        6: 'var(--space-6)',
        8: 'var(--space-8)',
        10: 'var(--space-10)',
        12: 'var(--space-12)',
        16: 'var(--space-16)',
        20: 'var(--space-20)',
        24: 'var(--space-24)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
