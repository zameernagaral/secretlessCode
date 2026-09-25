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
        background: '#1B1B16',
        text: '#EDE8DC',
        primary: '#B5451B',
        secondary: '#8A8672',
        accent: '#E8B93D',
        // Provide standard variants that are mapped back to our brand colors to ensure UI components don't break,
        // but avoid generic blue/purple styles as requested.
        muted: '#8A8672',
        border: '#8A8672',
        input: '#8A8672',
        ring: '#E8B93D',
        surface: {
          50: '#2A2A22',
          100: '#24241D',
          200: '#1F1F19',
          300: '#1B1B16'
        }
      },
      fontFamily: {
        heading: ['"Archivo"', 'sans-serif'],
        body: ['"IBM Plex Sans"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
        sans: ['"IBM Plex Sans"', 'sans-serif'], // fallback for standard sans
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan-line': 'scanline 2s ease-in-out infinite',
      },
      keyframes: {
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' },
        }
      }
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
