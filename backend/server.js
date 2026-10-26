import { openDatabase } from './database.js';
import { createApp } from './app.js';
process.umask(0o077);
const port = Number(process.env.PORT || 3000), rateLimit = Number(process.env.RATE_LIMIT || 10);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be between 1 and 65535.');
if (!Number.isInteger(rateLimit) || rateLimit < 1) throw new Error('RATE_LIMIT must be a positive integer.');
const production = process.env.NODE_ENV === 'production';
if (production && !process.env.PUBLIC_ORIGIN?.startsWith('https://')) throw new Error('Set PUBLIC_ORIGIN to the public HTTPS origin in production.');
const database = openDatabase(process.env.DATABASE_PATH || './data/ayushman.sqlite');
const server = createApp({ database, origin: process.env.PUBLIC_ORIGIN || `http://localhost:${port}`, rateLimit, production });
server.listen(port, process.env.HOST || '127.0.0.1', () => console.log(`Ayushman application listening on port ${port}`));
let shuttingDown = false;
function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  server.close(() => { database.close(); process.exit(0); });
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on('SIGINT', shutdown); process.on('SIGTERM', shutdown);
