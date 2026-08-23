import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Emit the built document as `shell.html` instead of `index.html`,
 * and record the bundled logo's fingerprinted URL inside it.
 *
 * `api/html.js` serves every HTML route so it can write the Search
 * Console verification tag, the Organization JSON-LD and the
 * dashboard's custom code into the response — none of which a
 * fetcher that does not run JavaScript would otherwise ever see.
 *
 * The rename is what makes that reachable. Vercel checks the
 * FILESYSTEM before it considers a rewrite, so an `index.html` at the
 * output root is served directly for `/` and the rewrite to
 * `/api/html` never fires — on the homepage, which is exactly the
 * page Search Console fetches. With no such file, every HTML path
 * falls through to the function.
 *
 * `npm run preview` serves the raw build and therefore has no
 * `index.html` to open at `/`; use `/shell.html` there, or the
 * deployed site, which is the only place the injection happens.
 */
function emitShell() {
  return {
    name: 'bedar-emit-shell',
    apply: 'build',
    closeBundle() {
      const dist = fileURLToPath(new URL('./dist', import.meta.url));
      const source = path.join(dist, 'index.html');
      if (!fs.existsSync(source)) {
        this.error('bedar-emit-shell: dist/index.html was not produced');
      }

      // The schema's fallback logo. The filename carries a content
      // hash and changes on every build, so it cannot be stored in
      // the database — the server reads it back out of the shell.
      const assets = path.join(dist, 'assets');
      const logo = fs.existsSync(assets)
        ? fs.readdirSync(assets).find((file) => /^bedar-logo-.*\.svg$/.test(file))
        : null;
      if (!logo) {
        this.error('bedar-emit-shell: the bundled logo asset was not found in dist/assets');
      }

      const html = fs
        .readFileSync(source, 'utf8')
        .replace('</head>', `  <meta name="bedar-logo" content="/assets/${logo}">\n  </head>`);

      fs.writeFileSync(path.join(dist, 'shell.html'), html);
      fs.rmSync(source);
      console.log(`bedar-emit-shell: dist/shell.html written (logo /assets/${logo})`);
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), emitShell()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@components': fileURLToPath(new URL('./src/components', import.meta.url)),
      '@pages': fileURLToPath(new URL('./src/pages', import.meta.url)),
      '@layouts': fileURLToPath(new URL('./src/layouts', import.meta.url)),
      '@hooks': fileURLToPath(new URL('./src/hooks', import.meta.url)),
      '@context': fileURLToPath(new URL('./src/context', import.meta.url)),
      '@services': fileURLToPath(new URL('./src/services', import.meta.url)),
      '@utils': fileURLToPath(new URL('./src/utils', import.meta.url)),
      '@assets': fileURLToPath(new URL('./src/assets', import.meta.url)),
      '@styles': fileURLToPath(new URL('./src/styles', import.meta.url)),
      '@content': fileURLToPath(new URL('./src/content', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    open: false,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        // Vite 8 bundles with Rolldown, which does not accept the
        // object form of `manualChunks` — it takes `codeSplitting`
        // groups instead. Splitting the big vendors out keeps them
        // in long-lived cache entries across content deploys, and
        // keeps Supabase out of the public site's critical path
        // (only the lazily-loaded admin routes pull it in).
        codeSplitting: {
          groups: [
            {
              name: 'react',
              test: /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/,
            },
            {
              name: 'motion',
              test: /[\\/]node_modules[\\/](framer-motion|motion-dom|motion-utils)[\\/]/,
            },
            { name: 'supabase', test: /[\\/]node_modules[\\/]@supabase[\\/]/ },
          ],
        },
      },
    },
  },
});
