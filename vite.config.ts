import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {fileURLToPath} from 'node:url';
import {defineConfig} from 'vite';
import {viteSingleFile} from 'vite-plugin-singlefile';

// `__dirname` non esiste nei moduli ESM: Vite 8 lo segnala come deprecato.
const currentDir =
  typeof import.meta.dirname === 'string'
    ? import.meta.dirname
    : path.dirname(fileURLToPath(import.meta.url));

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
    plugins: [react(), tailwindcss(), ...(single ? [viteSingleFile()] : [])],
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
