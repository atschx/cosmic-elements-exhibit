import { rename, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

/**
 * Two pages, two build targets, one config:
 *   `vite build`                → dist/        multi-page static site for GitHub Pages (base = repo sub-path)
 *                                              /            landing page (the story)      ← index.html
 *                                              /exhibit/    the interactive exhibit       ← exhibit/index.html
 *   `vite build --mode single`  → dist-single/ one self-contained index.html of the exhibit only
 *                                              (CSS + JS + data inlined, zero requests; the landing is not included)
 */
export default defineConfig(({ mode }) => {
  const single = mode === 'single';
  const page = (file: string): string => resolve(import.meta.dirname, file);
  const input: Record<string, string> = single
    ? { exhibit: page('exhibit/index.html') }
    : { landing: page('index.html'), exhibit: page('exhibit/index.html') };
  return {
    base: single ? './' : '/cosmic-elements-exhibit/',
    // the story images under public/ belong to the landing page only
    publicDir: single ? false : 'public',
    plugins: [
      react(),
      ...(single
        ? [
            viteSingleFile({ removeViteModuleLoader: true, useRecommendedBuildConfig: true }),
            exhibitAtRoot(),
          ]
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
      rollupOptions: { input },
    },
    preview: { port: single ? 4174 : 4173, strictPort: true },
    server: { port: 5173 },
  };
});

/** Single-file mode builds only exhibit/index.html; hoist it to dist-single/index.html. */
function exhibitAtRoot(): Plugin {
  let outDir = '';
  return {
    name: 'cosmic:exhibit-at-root',
    apply: 'build',
    configResolved(config) {
      outDir = config.build.outDir;
    },
    async closeBundle() {
      await rename(resolve(outDir, 'exhibit/index.html'), resolve(outDir, 'index.html'));
      await rm(resolve(outDir, 'exhibit'), { recursive: true, force: true });
    },
  };
}
