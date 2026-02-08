import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig({
  build: {
    rollupOptions: {
      external: [
        'better-sqlite3',
        'electron',
        'electron-squirrel-startup',
      ],
    },
  },
  resolve: {
    // Ensure native .node addons are not processed
    conditions: ['node'],
  },
});
