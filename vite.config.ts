import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {fileURLToPath} from 'node:url';
import fs from 'node:fs';
import {defineConfig} from 'vite';
import {viteSingleFile} from 'vite-plugin-singlefile';

// `__dirname` non esiste nei moduli ESM: Vite 8 lo segnala come deprecato.
const currentDir =
  typeof import.meta.dirname === 'string'
    ? import.meta.dirname
    : path.dirname(fileURLToPath(import.meta.url));

/**
 * In sviluppo l'entry è `index.src.html`: alla root del repo vive invece
 * `index.html`, cioè la build single-file che GitHub Pages pubblica.
 * Questo middleware fa sì che `npm run dev` su http://localhost:3000/
 * continui a funzionare come prima.
 */
const devIndexRewrite = {
  name: 'dev-index-rewrite',
  configureServer(server: any) {
    server.middlewares.use((req: any, _res: any, next: any) => {
      if (req.url === '/' || req.url === '/index.html') req.url = '/index.src.html';
      next();
    });
  },
};

/** Rinomina l'html emesso (index.src.html) in index.html dentro dist/. */
const renameBuiltIndex = {
  name: 'rename-built-index',
  closeBundle() {
    const from = path.resolve(currentDir, 'dist/index.src.html');
    const to = path.resolve(currentDir, 'dist/index.html');
    if (fs.existsSync(from)) fs.renameSync(from, to);
  },
};

export default defineConfig(({mode}) => {
  // mode === 'single'  ->  build in UN SOLO file index.html (JS, CSS e immagini
  //                        incorporati): basta trascinare quel file su GitHub,
  //                        senza creare alcuna cartella.
  const single = mode === 'single';
  return {
    // IMPORTANTE per GitHub Pages.
    // Il sito è pubblicato sotto un sottopercorso (https://<utente>.github.io/ToPush/),
    // quindi gli asset NON devono essere referenziati con path assoluti ("/assets/..."):
    // finirebbero su https://<utente>.github.io/assets/... -> 404 -> pagina bianca.
    // './' genera URL relativi, che funzionano a qualsiasi sottopercorso e anche
    // aprendo il sito dopo aver rinominato il repository.
    // Sovrascrivibile con VITE_BASE (es. VITE_BASE=/ToPush/) se serve un path assoluto.
    base: process.env.VITE_BASE || './',
    plugins: [react(), tailwindcss(), devIndexRewrite, renameBuiltIndex, ...(single ? [viteSingleFile()] : [])],
    resolve: {
      alias: {
        '@': path.resolve(currentDir, '.'),
      },
    },
    build: {
      outDir: 'dist',
      // Evita che un deploy sporco si trascini dietro file di build precedenti.
      emptyOutDir: true,
      // Le immagini demo superano il limite di inline di default: restano file
      // separati con hash, così la cache del browser lavora correttamente.
      assetsInlineLimit: single ? 100_000_000 : 4096,
      // L'entry HTML sorgente non è più index.html (che è l'output pubblicato)
      // ma index.src.html; l'output viene rinominato in index.html dal plugin.
      rollupOptions: {input: 'index.src.html'},
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
