// Static preview server. Unknown paths get the SPA fallback, as the host does.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const root = 'build/client';
const port = Number(process.env.PORT ?? 4173);
const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.webp': 'image/webp', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.txt': 'text/plain',
  '.mp4': 'video/mp4', '.data': 'text/plain',
};

async function resolve(pathname) {
  const clean = normalize(decodeURIComponent(pathname)).replace(/^[\\/]+/, '');
  for (const candidate of [clean, join(clean, 'index.html')]) {
    const file = join(root, candidate);
    if (!file.startsWith(root)) continue;
    const info = await stat(file).catch(() => null);
    if (info?.isFile()) return { file, status: 200 };
  }
  return { file: join(root, '__spa-fallback.html'), status: 200 };
}

createServer(async (req, res) => {
  const { pathname } = new URL(req.url ?? '/', 'http://localhost');
  const { file, status } = await resolve(pathname);
  try {
    const body = await readFile(file);
    res.writeHead(status, { 'content-type': types[extname(file)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404).end('Not found');
  }
}).listen(port, () => console.log(`preview on http://localhost:${port}`));
