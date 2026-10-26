import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateEnquiry, services } from './validation.js';
const frontend = fileURLToPath(new URL('../frontend/', import.meta.url));
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
const csp = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; frame-src https://maps.google.com https://www.google.com; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'";
export function createApp({ database, origin = 'http://localhost:3000', rateLimit = 10, production = false, now = Date.now }) {
  const allowedOrigin = new URL(origin).origin;
  const buckets = new Map();
  function consume(ip) {
    const time = now();
    for (const [key, bucket] of buckets) if (bucket.expires <= time) buckets.delete(key);
    let bucket = buckets.get(ip);
    if (!bucket) { if (buckets.size > 10000) return false; bucket = { count: 0, expires: time + 15 * 60 * 1000 }; buckets.set(ip, bucket); }
    return ++bucket.count <= rateLimit;
  }
  const server = createServer(async (req, res) => {
    res.setHeader('Content-Security-Policy', csp);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader('X-Frame-Options', 'DENY');
    if (production) res.setHeader('Strict-Transport-Security', 'max-age=31536000');
    function json(status, data) { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(data)); }
    try {
      const url = new URL(req.url, allowedOrigin);
      if (url.pathname === '/api/health' && req.method === 'GET') { database.db.prepare('SELECT 1').get(); return json(200, { status: 'ok' }); }
      if (url.pathname === '/api/services' && req.method === 'GET') return json(200, { services });
      if (url.pathname === '/api/appointments') {
        if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return json(405, { error: 'Method not allowed.' }); }
        if (req.headers.origin !== allowedOrigin || req.headers['sec-fetch-site'] === 'cross-site') return json(403, { error: 'Submit this form from the clinic website.' });
        if (!consume(req.socket.remoteAddress)) { res.setHeader('Retry-After', '900'); return json(429, { error: 'Too many enquiries. Please try later or call the clinic.' }); }
        if (req.headers['content-type']?.split(';')[0].trim().toLowerCase() !== 'application/json') return json(415, { error: 'Content-Type must be application/json.' });
        const key = req.headers['idempotency-key'];
        if (typeof key !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(key)) return json(400, { error: 'A valid request identifier is required. Reload the page and try again.' });
        let size = 0; const chunks = [];
        for await (const chunk of req) { size += chunk.length; if (size > 4096) return json(413, { error: 'Request is too large.' }); chunks.push(chunk); }
        let body;
        try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { return json(400, { error: 'Invalid JSON.' }); }
        const validation = validateEnquiry(body);
        if (validation.error) return json(422, { error: validation.error });
        const saved = database.create(validation.value, key);
        if (saved.conflict) return json(409, { error: 'This request identifier was already used. Reload the page before submitting changed details.' });
        return json(saved.duplicate ? 200 : 201, { id: saved.id, status: 'received', message: 'Your enquiry has been recorded. This is not a confirmed appointment. Contact the clinic to confirm availability.' });
      }
      if (url.pathname.startsWith('/api/')) return json(404, { error: 'Not found.' });
      if (!['GET', 'HEAD'].includes(req.method)) { res.setHeader('Allow', 'GET, HEAD'); return json(405, { error: 'Method not allowed.' }); }
      let path;
      try { path = decodeURIComponent(url.pathname); } catch { return json(400, { error: 'Invalid URL.' }); }
      if (path.split('/').some(segment => segment.startsWith('.')) || path.includes('\\') || path.includes('\0')) return json(404, { error: 'Not found.' });
      const file = resolve(frontend, '.' + (path === '/' ? '/index.html' : path));
      if (!file.startsWith(resolve(frontend) + sep)) return json(404, { error: 'Not found.' });
      const type = types[extname(file)];
      if (!type) return json(404, { error: 'Not found.' });
      let contents;
      try { if (!(await stat(file)).isFile()) return json(404, { error: 'Not found.' }); contents = await readFile(file); } catch (error) { if (['ENOENT','ENOTDIR'].includes(error.code)) return json(404, { error: 'Not found.' }); throw error; }
      res.writeHead(200, { 'Content-Type': type, 'Content-Length': contents.length, 'Cache-Control': extname(file) === '.webp' ? 'public, max-age=86400' : 'no-cache' });
      res.end(req.method === 'HEAD' ? undefined : contents);
    } catch { if (!res.headersSent) json(500, { error: 'We could not process this request. Please try again or call the clinic.' }); else res.end(); }
  });
  server.requestTimeout = 15000;
  server.headersTimeout = 10000;
  server.keepAliveTimeout = 5000;
  return server;
}
