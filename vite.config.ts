import { execSync } from 'node:child_process';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * A stamp for the built bundle, shown on the Settings screen.
 *
 * Without it there is no way to tell whether a phone is running the current
 * build or a cached older one, which turns "it doesn't work for me" into
 * guesswork.
 */
function buildStamp(): string {
  let sha = 'nogit';
  try {
    sha = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch {
    // Building outside a checkout is fine; the date alone still tells us something.
  }
  return `${new Date().toISOString().slice(0, 16).replace('T', ' ')} ${sha}`;
}

export default defineConfig({
  plugins: [react()],
  define: { __BUILD__: JSON.stringify(buildStamp()) },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        // The Firebase SDK is most of the bundle and almost never changes.
        // Splitting it means shipping an app tweak doesn't re-download it.
        manualChunks: { firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'] },
      },
    },
  },
});
