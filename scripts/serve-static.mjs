// Minimal static server for e2e tests: serves playground/ and dist/.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const ROOT = new URL('../', import.meta.url).pathname;
const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.png': 'image/png',
  '.css': 'text/css',
};

const server = createServer(async (req, res) => {
  try {
    let urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (urlPath.endsWith('/ferry.global.js')) {
      urlPath = '/dist/ferry.global.js';
    }
    if (urlPath.endsWith('.bundle.js')) {
      urlPath = `/playground${urlPath}`;
    }
    // Prevent path traversal
    const file = normalize(join(ROOT, urlPath === '/' ? 'playground/index.html' : urlPath));
    if (!file.startsWith(ROOT)) {
      res.writeHead(403).end('forbidden');
      return;
    }
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404).end('not found');
  }
});

server.listen(4173, () => console.log('static server on :4173'));
