import { openDatabase } from './database.js';
process.umask(0o077);
const [command = 'help', id, status] = process.argv.slice(2);
if (!['list','status','purge'].includes(command)) {
  console.log('Staff CLI (requires direct server access):\n  npm run appointments -- list\n  npm run appointments -- status <id> <new|contacted|confirmed|closed>\n  npm run appointments -- purge <days> --confirm');
} else {
  const database = openDatabase(process.env.DATABASE_PATH || './data/ayushman.sqlite');
  try {
    if (command === 'list') console.table(database.db.prepare('SELECT id, name, phone, service, preferred_date, status, created_at FROM appointments ORDER BY created_at DESC LIMIT 100').all());
    if (command === 'status') {
      if (!id || !['new','contacted','confirmed','closed'].includes(status)) throw new Error('Supply an appointment ID and valid status.');
      const result = database.db.prepare('UPDATE appointments SET status = ? WHERE id = ?').run(status, id);
      console.log(`${result.changes} enquiry updated.`);
    }
    if (command === 'purge') {
      const days = Number(id);
      if (!Number.isInteger(days) || days < 1 || status !== '--confirm') throw new Error('Use purge <positive days> --confirm. This permanently deletes older enquiries.');
      const cutoff = new Date(Date.now() - days * 86400000).toISOString();
      console.log(`${database.db.prepare('DELETE FROM appointments WHERE created_at < ?').run(cutoff).changes} old enquiries deleted.`);
    }
  } finally { database.close(); }
}
