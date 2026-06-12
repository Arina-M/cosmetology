'use strict';

/**
 * Проста й безпечна авторизація адмінки без зовнішніх залежностей.
 * Логін за паролем (ADMIN_PASSWORD) → видаємо підписаний HMAC-токен у httpOnly cookie.
 * Сесія діє SESSION_TTL годин.
 */

const crypto = require('crypto');

const SECRET = process.env.SESSION_SECRET || 'change-me-please';
const TTL_HOURS = Number(process.env.SESSION_TTL_HOURS || 12);
const COOKIE = 'svitla_admin';

function sign(payload) {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
}

function verify(token) {
  if (!token || !token.includes('.')) return null;
  const [data, sig] = token.split('.');
  const expected = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
  // порівняння у сталий час, захист від timing-атак
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString());
    if (payload.exp && Date.now() > payload.exp) return null; // протермінований
    return payload;
  } catch {
    return null;
  }
}

/** Створити токен сесії після успішного логіну */
function createSession() {
  return sign({ role: 'admin', exp: Date.now() + TTL_HOURS * 3600 * 1000 });
}

/** Перевірка пароля (підтримує захардкоджений у .env пароль) */
function checkPassword(input) {
  const real = process.env.ADMIN_PASSWORD || 'admin';
  if (!input) return false;
  const a = Buffer.from(String(input));
  const b = Buffer.from(String(real));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Middleware: пускає далі лише авторизованих, інакше → /admin/login */
function requireAuth(req, res, next) {
  const token = req.cookies?.[COOKIE];
  const session = verify(token);
  if (!session) return res.redirect('/admin/login');
  req.admin = session;
  next();
}

module.exports = { COOKIE, TTL_HOURS, createSession, checkPassword, requireAuth, verify };
