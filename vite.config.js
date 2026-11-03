import { defineConfig, loadEnv } from 'vite';
import { readFileSync } from 'node:fs';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  for (const [key, value] of Object.entries(env)) process.env[key] ??= value;
  return {
    plugins: [{
      name: 'verity-html-views',
      transformIndexHtml: {
        order: 'pre',
        handler(html) {
          return html.replace(/<!-- view:([a-z-]+) -->/g, (_, name) =>
            readFileSync(new URL(`./src/views/${name}.html`, import.meta.url), 'utf8'));
        }
      },
      configureServer(server) {
        server.watcher.add('src/views/**/*.html');
        server.watcher.on('change', file => {
          if (file.includes('views') && file.endsWith('.html')) server.ws.send({ type: 'full-reload' });
        });
        server.middlewares.use(async (req, res, next) => {
          const route = new URL(req.url, 'http://localhost').pathname;
          if (!['/api/config', '/api/evaluate'].includes(route)) return next();
          res.status = code => { res.statusCode = code; return res; };
          res.json = value => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(value)); };
          try {
            let body = '';
            for await (const chunk of req) {
              body += chunk;
              if (Buffer.byteLength(body) > 256_000) return res.status(413).json({ error: 'Request too large' });
            }
            try { req.body = body ? JSON.parse(body) : {}; }
            catch { return res.status(400).json({ error: 'Invalid JSON' }); }
            const { default: handler } = route === '/api/config'
              ? await import('./api/config.js') : await import('./api/evaluate.js');
            await handler(req, res);
          } catch (error) {
            server.config.logger.error(error.message);
            if (!res.writableEnded) res.status(500).json({ error: 'Local API error' });
          }
        });
      }
    }]
  };
});
