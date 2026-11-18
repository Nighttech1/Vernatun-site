/** @type {import('tailwindcss').Config} */
export default {
  prefix: 'tw-',
  content: [
    './src/components/BoardPanel.tsx',
    './src/components/TldrawBoardTools.tsx',
    './src/components/whiteboard/**/*.{tsx,ts}',
  ],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {},
  },
  plugins: [],
};
