import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

/**
 * Two build targets share one config:
 *   `vite build`                → dist/        multi-file static site for GitHub Pages (base = repo sub-path)
 *   `vite build --mode single`  → dist-single/ one self-contained index.html (CSS + JS + data inlined, zero requests)
 */
export default defineConfig(({ mode }) => {
  const single = mode === 'single';
  return {
    base: single ? './' : '/cosmic-elements-exhibit/',
    plugins: [
      react(),
      ...(single
        ? [viteSingleFile({ removeViteModuleLoader: true, useRecommendedBuildConfig: true })]
        : []),
    ],
    build: {
      outDir: single ? 'dist-single' : 'dist',
      emptyOutDir: true,
      target: 'es2022',
      sourcemap: false,
      cssCodeSplit: !single,
      modulePreload: !single,
      reportCompressedSize: false,
    },
    preview: { port: single ? 4174 : 4173, strictPort: true },
    server: { port: 5173 },
  };
});
