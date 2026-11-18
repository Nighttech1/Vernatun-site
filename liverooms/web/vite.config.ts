import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

/** Serve main Vernatun static HTML/CSS/JS from repo root on localhost. */
function serveSiteRoot(repoRoot: string): Plugin {
  const htmlMap: Record<string, string> = {
    '/': 'index.html',
    '/index.html': 'index.html',
    '/schedule': 'schedule.html',
    '/schedule.html': 'schedule.html',
    '/materials': 'materials.html',
    '/materials.html': 'materials.html',
    '/articles': 'articles.html',
    '/articles.html': 'articles.html',
    '/contacts': 'contacts.html',
    '/contacts.html': 'contacts.html',
    '/about': 'about.html',
    '/about.html': 'about.html',
  };

  return {
    name: 'vernatun-site-static',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url || '').split('?')[0];
        // Let Vite/React own SPA campus routes
        if (
          url.startsWith('/campus') ||
          url.startsWith('/room') ||
          url.startsWith('/src') ||
          url.startsWith('/@') ||
          url.startsWith('/node_modules') ||
          url.startsWith('/api')
        ) {
          next();
          return;
        }
        const mapped = htmlMap[url];
        if (mapped) {
          const file = path.join(repoRoot, mapped);
          if (fs.existsSync(file)) {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            fs.createReadStream(file).pipe(res);
            return;
          }
        }
        // css / js / public assets from repo
        if (
          url.startsWith('/css/') ||
          url.startsWith('/js/') ||
          url.startsWith('/fonts/') ||
          url.startsWith('/images/') ||
          url.startsWith('/videos/') ||
          url.startsWith('/favicon')
        ) {
          const file = path.join(repoRoot, url.replace(/^\//, ''));
          if (fs.existsSync(file) && fs.statSync(file).isFile()) {
            const ext = path.extname(file).toLowerCase();
            const types: Record<string, string> = {
              '.css': 'text/css',
              '.js': 'application/javascript',
              '.ttf': 'font/ttf',
              '.woff2': 'font/woff2',
              '.png': 'image/png',
              '.jpg': 'image/jpeg',
              '.jpeg': 'image/jpeg',
              '.svg': 'image/svg+xml',
              '.mp4': 'video/mp4',
              '.ico': 'image/x-icon',
            };
            res.setHeader('Content-Type', types[ext] || 'application/octet-stream');
            fs.createReadStream(file).pipe(res);
            return;
          }
        }
        next();
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:8765';
  const repoRoot = path.resolve(__dirname, '../..');

  return {
    plugins: [react(), serveSiteRoot(repoRoot)],
    base: '/',
    build: {
      outDir: 'dist',
    },
    server: {
      host: '127.0.0.1',
      port: 5173,
      strictPort: true,
      fs: {
        allow: [repoRoot, path.resolve(__dirname)],
      },
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
        },
        '/spacedeck': {
          target: 'http://127.0.0.1:9666',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/spacedeck/, '') || '/',
        },
      },
    },
  };
});
