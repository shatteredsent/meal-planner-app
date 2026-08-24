import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: { __BUILD__: JSON.stringify('test') },
  test: {
    // Logic tests run in node. Files needing a DOM opt in with a
    // `// @vitest-environment jsdom` docblock — see Plan.dom.test.tsx.
    environment: 'node',
  },
});
