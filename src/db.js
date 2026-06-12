'use strict';

/**
 * Шар бази даних на вбудованому в Node.js модулі node:sqlite.
 * Жодних нативних збірок — працює всюди, де є Node 22.5+.
 *
 * Якщо колись захочете перейти на PostgreSQL/MySQL — достатньо
 * переписати лише функції нижче, інша частина застосунку не зміниться.
 */

const path = require('path');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');

// Файл бази (можна змінити через змінну середовища DB_FILE)
const DB_FILE = process.env.DB_FILE || path.join(__dirname, '..', 'data', 'svitla.db');
fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });

const db = new DatabaseSync(DB_FILE);

// Вмикаємо WAL — безпечніше при одночасних запитах
db.exec('PRAGMA journal_mode = WAL;');

// Схема таблиці заявок
db.exec(`
  CREATE TABLE IF NOT EXISTS bookings (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL,
    phone      TEXT    NOT NULL,
    service    TEXT,
    message    TEXT,
    status     TEXT    NOT NULL DEFAULT 'new',  -- new | confirmed | done | canceled
    ip         TEXT,
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );
`);

const STATUSES = ['new', 'confirmed', 'done', 'canceled'];

/** Створити нову заявку */
function createBooking({ name, phone, service, message, ip }) {
  const stmt = db.prepare(`
    INSERT INTO bookings (name, phone, service, message, ip)
    VALUES (?, ?, ?, ?, ?)
  `);
  const info = stmt.run(
    name,
    phone,
    service || null,
    message || null,
    ip || null
  );
  return getBooking(info.lastInsertRowid);
}

/** Отримати одну заявку за id */
function getBooking(id) {
  return db.prepare('SELECT * FROM bookings WHERE id = ?').get(id);
}

/** Список заявок з опціональним фільтром за статусом */
function listBookings({ status } = {}) {
  if (status && STATUSES.includes(status)) {
    return db
      .prepare('SELECT * FROM bookings WHERE status = ? ORDER BY id DESC')
      .all(status);
  }
  return db.prepare('SELECT * FROM bookings ORDER BY id DESC').all();
}

/** Змінити статус заявки */
function updateStatus(id, status) {
  if (!STATUSES.includes(status)) return null;
  db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run(status, id);
  return getBooking(id);
}

/** Видалити заявку */
function deleteBooking(id) {
  const info = db.prepare('DELETE FROM bookings WHERE id = ?').run(id);
  return info.changes > 0;
}

/** Зведена статистика для дашборда */
function getStats() {
  const total = db.prepare('SELECT COUNT(*) AS c FROM bookings').get().c;
  const newCount = db
    .prepare("SELECT COUNT(*) AS c FROM bookings WHERE status = 'new'").get().c;
  const today = db
    .prepare("SELECT COUNT(*) AS c FROM bookings WHERE date(created_at) = date('now')")
    .get().c;
  const done = db
    .prepare("SELECT COUNT(*) AS c FROM bookings WHERE status = 'done'").get().c;
  return { total, new: newCount, today, done };
}

module.exports = {
  STATUSES,
  createBooking,
  getBooking,
  listBookings,
  updateStatus,
  deleteBooking,
  getStats,
};
