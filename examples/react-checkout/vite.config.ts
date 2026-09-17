import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  /**
   * Custom elements are defined by a side-effect import. Vite's dep optimiser
   * would otherwise pre-bundle @meridian/components and, during development,
   * serve a copy that defines the elements a second time — which throws
   * "the name mrd-button has already been used with this registry".
   */
  optimizeDeps: { exclude: ['@meridian/components'] },
});
