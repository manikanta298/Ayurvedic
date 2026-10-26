import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, chmodSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { randomUUID, createHash } from 'node:crypto';
export function openDatabase(filename = './data/ayushman.sqlite') {
  if (filename !== ':memory:') mkdirSync(dirname(resolve(filename)), { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(filename, { timeout: 5000 });
  if (filename !== ':memory:') chmodSync(filename, 0o600);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      request_key TEXT NOT NULL UNIQUE,
      payload_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      service TEXT NOT NULL,
      preferred_date TEXT,
      status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new','contacted','confirmed','closed')),
      consent_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    ) STRICT;
    CREATE INDEX IF NOT EXISTS appointments_created_at ON appointments(created_at);
    PRAGMA user_version=1;`);
  const find = db.prepare('SELECT id, payload_hash FROM appointments WHERE request_key = ?');
  const insert = db.prepare('INSERT INTO appointments (id, request_key, payload_hash, name, phone, service, preferred_date, consent_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  return {
    db,
    create(value, key) {
      const hash = createHash('sha256').update(JSON.stringify(value)).digest('hex');
      db.exec('BEGIN IMMEDIATE');
      try {
        const existing = find.get(key);
        if (existing) {
          db.exec('COMMIT');
          return existing.payload_hash === hash ? { id: existing.id, duplicate: true } : { conflict: true };
        }
        const id = randomUUID(), timestamp = new Date().toISOString();
        insert.run(id, key, hash, value.name, value.phone, value.service, value.preferredDate, timestamp, timestamp);
        db.exec('COMMIT');
        return { id, duplicate: false };
      } catch (error) { db.exec('ROLLBACK'); throw error; }
    },
    close() { db.close(); }
  };
}
