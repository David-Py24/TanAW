import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, Plugin } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function tanawRoutesPlugin(): Plugin {
  const rewriteHandler = (req: any, _res: any, next: () => void) => {
    const rawUrl = req.url ? req.url.split('?')[0] : '';
    if (rawUrl === '/signin' || rawUrl === '/signin/') {
      req.url = req.url.replace(/^\/signin\/?/, '/signin.html');
    } else if (rawUrl === '/signup' || rawUrl === '/signup/') {
      req.url = req.url.replace(/^\/signup\/?/, '/signup.html');
    } else if (
      rawUrl === '/app' ||
      rawUrl === '/app/' ||
      rawUrl === '/map' ||
      rawUrl === '/map/'
    ) {
      req.url = req.url.replace(/^\/(app|map)\/?/, '/app.html');
    }
    next();
  };

  return {
    name: 'tanaw-routes-middleware',
    configureServer(server) {
      server.middlewares.use(rewriteHandler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(rewriteHandler);
    },
  };
}

export default defineConfig(() => {
  return {
    base: './',
    plugins: [react(), tailwindcss(), tanawRoutesPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          signin: path.resolve(__dirname, 'signin.html'),
          signup: path.resolve(__dirname, 'signup.html'),
          app: path.resolve(__dirname, 'app.html'),
        },
      },
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
