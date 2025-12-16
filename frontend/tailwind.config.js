/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
      },
      spacing: {
        'safe-left': 'max(1rem, env(safe-area-inset-left))',
        'safe-right': 'max(1rem, env(safe-area-inset-right))',
      },
      minHeight: {
        touch: '2.75rem',
      },
      minWidth: {
        touch: '2.75rem',
      },
    },
  },
  plugins: [],
  corePlugins: {
    aspectRatio: true,
  },
};
