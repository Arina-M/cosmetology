'use strict';

require('dotenv').config();

const path = require('path');
const express = require('express');
const rateLimit = require('express-rate-limit');

const db = require('./db');
const auth = require('./auth');
const views = require('./views');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1); // коректний IP за reverse-proxy (Render/Railway/Nginx)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- мінімальний парсер cookie (без зайвих залежностей) ---
app.use((req, _res, next) => {
  req.cookies = {};
  const raw = req.headers.cookie;
  if (raw) {
    raw.split(';').forEach((c) => {
      const i = c.indexOf('=');
      if (i > -1) req.cookies[c.slice(0, i).trim()] = decodeURIComponent(c.slice(i + 1).trim());
    });
  }
  next();
});

// CORS (на випадок, якщо фронтенд хоститься окремо)
const ORIGIN = process.env.CORS_ORIGIN || '*';
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', ORIGIN);
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// ============================================================
//  ПУБЛІЧНИЙ API — прийом заявок із форми
// ============================================================

const bookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 хв
  max: 8,                    // не більше 8 заявок з одного IP за вікно
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Забагато спроб. Спробуйте трохи пізніше.' },
});

function validateBooking(body) {
  const errors = [];
  const name = String(body.name || '').trim();
  const phone = String(body.phone || '').trim();
  const service = String(body.service || '').trim().slice(0, 120) || null;
  const message = String(body.message || '').trim().slice(0, 1000) || null;

  if (name.length < 2 || name.length > 80) errors.push("Вкажіть коректне ім'я.");
  // лояльна перевірка телефону: 7–20 символів, лише цифри/пробіли/+()-.
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15 || !/^[\d\s+()\-]+$/.test(phone)) {
    errors.push('Вкажіть коректний номер телефону.');
  }
  return { errors, value: { name, phone, service, message } };
}

async function notifyTelegram(b) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return; // не налаштовано — мовчки пропускаємо
  const text =
    `🌿 *Нова заявка — Світла*\n\n` +
    `👤 ${b.name}\n📞 ${b.phone}\n` +
    (b.service ? `💆 ${b.service}\n` : '') +
    (b.message ? `📝 ${b.message}\n` : '');
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
    });
  } catch (e) {
    console.error('Telegram notify failed:', e.message);
  }
}

app.post('/api/bookings', bookingLimiter, async (req, res) => {
  // honeypot: приховане поле "website" заповнюють лише боти
  if (req.body.website) return res.json({ ok: true }); // вдаємо успіх, але ігноруємо

  const { errors, value } = validateBooking(req.body);
  if (errors.length) return res.status(400).json({ ok: false, error: errors.join(' ') });

  try {
    const booking = db.createBooking({
      ...value,
      ip: req.ip,
    });
    notifyTelegram(booking); // не чекаємо — відповідаємо одразу
    return res.status(201).json({ ok: true, id: booking.id });
  } catch (e) {
    console.error('Create booking error:', e);
    return res.status(500).json({ ok: false, error: 'Сталася помилка. Спробуйте пізніше.' });
  }
});

// ============================================================
//  АДМІНКА
// ============================================================

app.get('/admin/login', (req, res) => {
  if (auth.verify(req.cookies[auth.COOKIE])) return res.redirect('/admin');
  res.send(views.loginPage());
});

const loginLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 10 });
app.post('/admin/login', loginLimiter, (req, res) => {
  if (!auth.checkPassword(req.body.password)) {
    return res.status(401).send(views.loginPage({ error: 'Невірний пароль.' }));
  }
  const token = auth.createSession();
  res.cookie(auth.COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: auth.TTL_HOURS * 3600 * 1000,
  });
  res.redirect('/admin');
});

app.get('/admin/logout', (req, res) => {
  res.clearCookie(auth.COOKIE);
  res.redirect('/admin/login');
});

app.get('/admin', auth.requireAuth, (req, res) => {
  const filter = db.STATUSES.includes(req.query.status) ? req.query.status : '';
  const bookings = db.listBookings({ status: filter });
  const stats = db.getStats();
  res.send(views.dashboardPage({ bookings, stats, filter }));
});

app.post('/admin/bookings/:id/status', auth.requireAuth, (req, res) => {
  db.updateStatus(Number(req.params.id), req.body.status);
  res.redirect(req.get('referer') || '/admin');
});

app.post('/admin/bookings/:id/delete', auth.requireAuth, (req, res) => {
  db.deleteBooking(Number(req.params.id));
  res.redirect(req.get('referer') || '/admin');
});

// JSON-видача заявок (наприклад, для інтеграцій) — теж під авторизацією
app.get('/admin/api/bookings', auth.requireAuth, (req, res) => {
  res.json({ ok: true, bookings: db.listBookings({ status: req.query.status }) });
});

// ============================================================
//  СТАТИКА (лендинг) + health-check
// ============================================================

app.get('/health', (_req, res) => res.json({ ok: true, uptime: process.uptime() }));

// Кладіть svitla-cosmetology.html у папку /public як index.html
app.use(express.static(path.join(__dirname, '..', 'public')));

app.listen(PORT, () => {
  console.log(`\n  Світла backend → http://localhost:${PORT}`);
  console.log(`  Адмінка        → http://localhost:${PORT}/admin`);
  console.log(`  API заявок     → POST http://localhost:${PORT}/api/bookings\n`);
});
