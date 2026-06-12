'use strict';

/**
 * Серверний рендер сторінок адмінки у фірмовому стилі «Світла».
 * Без шаблонізаторів — звичайні функції, що повертають HTML.
 */

const STATUS_LABELS = {
  new: 'Нова',
  confirmed: 'Підтверджена',
  done: 'Виконана',
  canceled: 'Скасована',
};

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const baseStyles = `
  :root{
    --bg:#f3f7fa;--surface:#fff;--powder:#e3eef5;--blue:#9cc4dd;--blue-ink:#3f7da0;
    --ink:#213d4a;--muted:#5f7d8c;--line:#dde9f0;--radius:18px;
    --shadow:0 18px 44px -26px rgba(33,61,74,.32);
  }
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Manrope',system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:var(--bg);color:var(--ink);line-height:1.55;padding:0}
  a{color:var(--blue-ink);text-decoration:none}
  .topbar{background:var(--surface);border-bottom:1px solid var(--line);padding:16px 28px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:5}
  .brand{font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:600;letter-spacing:.02em}
  .brand small{display:block;font-family:inherit;font-size:9.5px;font-weight:700;letter-spacing:.28em;text-transform:uppercase;color:var(--blue-ink);margin-top:2px}
  .wrap{max-width:1080px;margin:0 auto;padding:28px}
  .btn{font:inherit;font-weight:600;font-size:14px;cursor:pointer;border:none;padding:10px 18px;border-radius:100px;transition:.25s;display:inline-flex;align-items:center;gap:7px;text-decoration:none}
  .btn-dark{background:var(--ink);color:#eaf3f8}.btn-dark:hover{background:var(--blue-ink)}
  .btn-ghost{background:var(--surface);color:var(--ink);border:1px solid var(--line)}.btn-ghost:hover{border-color:var(--blue-ink)}
  .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:26px}
  .stat{background:var(--surface);border:1px solid var(--line);border-radius:var(--radius);padding:20px}
  .stat .n{font-family:Georgia,serif;font-size:34px;font-weight:600;line-height:1}
  .stat .l{font-size:13px;color:var(--muted);margin-top:6px}
  .filters{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px}
  .filters a{padding:8px 16px;border-radius:100px;font-size:13.5px;font-weight:600;background:var(--surface);border:1px solid var(--line);color:var(--muted)}
  .filters a.active{background:var(--ink);color:#fff;border-color:var(--ink)}
  .card{background:var(--surface);border:1px solid var(--line);border-radius:var(--radius);overflow:hidden;box-shadow:var(--shadow)}
  table{width:100%;border-collapse:collapse}
  th,td{text-align:left;padding:14px 16px;font-size:14px;border-bottom:1px solid var(--line);vertical-align:middle}
  th{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);font-weight:700;background:#fafcfe}
  tr:last-child td{border-bottom:none}
  td .name{font-weight:600}
  td .phone a{font-weight:600}
  .badge{display:inline-block;padding:4px 11px;border-radius:100px;font-size:12px;font-weight:600;white-space:nowrap}
  .b-new{background:#e3eef5;color:#3f7da0}
  .b-confirmed{background:#dff0e6;color:#3c8a5e}
  .b-done{background:#e7e3f5;color:#6a55a8}
  .b-canceled{background:#f5e3e3;color:#a85555}
  .actions{display:flex;gap:6px;flex-wrap:wrap}
  .actions button,.actions a{font:inherit;font-size:12px;font-weight:600;cursor:pointer;border:1px solid var(--line);background:#fff;color:var(--ink);padding:6px 11px;border-radius:8px;transition:.2s}
  .actions button:hover{border-color:var(--blue-ink);color:var(--blue-ink)}
  .actions .del:hover{border-color:#c66;color:#c66}
  .muted{color:var(--muted);font-size:13px}
  .empty{padding:60px 20px;text-align:center;color:var(--muted)}
  .when{color:var(--muted);font-size:12.5px;white-space:nowrap}
  @media(max-width:760px){
    .stats{grid-template-columns:1fr 1fr}
    .wrap{padding:18px}
    table,thead,tbody,th,td,tr{display:block}
    thead{display:none}
    tr{border-bottom:1px solid var(--line);padding:14px 16px}
    td{border:none;padding:5px 0}
    td::before{content:attr(data-l);display:inline-block;width:96px;font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);font-weight:700}
  }
`;

const fontLink = `<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">`;

function page(title, body) {
  return `<!DOCTYPE html><html lang="uk"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>${esc(title)} · Світла</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>${fontLink}
<style>${baseStyles}</style></head><body>${body}</body></html>`;
}

function loginPage({ error } = {}) {
  return page('Вхід', `
  <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px">
    <form method="POST" action="/admin/login" class="card" style="padding:38px 34px;max-width:380px;width:100%">
      <div class="brand" style="margin-bottom:6px">Світла<small>Адмін-панель</small></div>
      <p class="muted" style="margin:6px 0 22px">Введіть пароль, щоб переглянути заявки.</p>
      ${error ? `<div style="background:#f5e3e3;color:#a85555;padding:10px 14px;border-radius:12px;font-size:13.5px;margin-bottom:14px">${esc(error)}</div>` : ''}
      <input type="password" name="password" placeholder="Пароль" required autofocus
        style="width:100%;padding:13px 16px;border:1px solid var(--line);border-radius:12px;font:inherit;font-size:15px;margin-bottom:14px">
      <button class="btn btn-dark" type="submit" style="width:100%;justify-content:center;padding:13px">Увійти</button>
    </form>
  </div>`);
}

function statusBadge(s) {
  return `<span class="badge b-${esc(s)}">${esc(STATUS_LABELS[s] || s)}</span>`;
}

function formatDate(iso) {
  // iso у форматі "YYYY-MM-DD HH:MM:SS" (UTC). Показуємо як є, коротко.
  if (!iso) return '';
  const [d, t] = iso.split(' ');
  const [y, m, day] = d.split('-');
  return `${day}.${m}.${y}${t ? ' · ' + t.slice(0, 5) : ''}`;
}

function row(b) {
  const next = {
    new: ['confirmed', 'Підтвердити'],
    confirmed: ['done', 'Виконано'],
    done: ['new', 'У роботу'],
    canceled: ['new', 'Відновити'],
  }[b.status];
  return `<tr>
    <td data-l="Клієнт"><div class="name">${esc(b.name)}</div></td>
    <td data-l="Телефон" class="phone"><a href="tel:${esc(b.phone)}">${esc(b.phone)}</a></td>
    <td data-l="Послуга" class="muted">${b.service ? esc(b.service) : '—'}</td>
    <td data-l="Статус">${statusBadge(b.status)}</td>
    <td data-l="Дата"><span class="when">${formatDate(b.created_at)}</span></td>
    <td data-l="Дії">
      <div class="actions">
        ${next ? `<form method="POST" action="/admin/bookings/${b.id}/status" style="display:inline"><input type="hidden" name="status" value="${next[0]}"><button type="submit">${next[1]}</button></form>` : ''}
        ${b.status !== 'canceled' ? `<form method="POST" action="/admin/bookings/${b.id}/status" style="display:inline"><input type="hidden" name="status" value="canceled"><button type="submit">Скасувати</button></form>` : ''}
        <form method="POST" action="/admin/bookings/${b.id}/delete" style="display:inline" onsubmit="return confirm('Видалити заявку назавжди?')"><button type="submit" class="del">Видалити</button></form>
      </div>
    </td>
  </tr>`;
}

function dashboardPage({ bookings, stats, filter }) {
  const tabs = [
    ['', 'Усі'],
    ['new', 'Нові'],
    ['confirmed', 'Підтверджені'],
    ['done', 'Виконані'],
    ['canceled', 'Скасовані'],
  ];
  const body = `
  <div class="topbar">
    <div class="brand">Світла<small>Заявки на запис</small></div>
    <a href="/admin/logout" class="btn btn-ghost">Вийти</a>
  </div>
  <div class="wrap">
    <div class="stats">
      <div class="stat"><div class="n">${stats.total}</div><div class="l">Усього заявок</div></div>
      <div class="stat"><div class="n">${stats.new}</div><div class="l">Нові (не оброблені)</div></div>
      <div class="stat"><div class="n">${stats.today}</div><div class="l">Сьогодні</div></div>
      <div class="stat"><div class="n">${stats.done}</div><div class="l">Виконані</div></div>
    </div>
    <div class="filters">
      ${tabs.map(([v, l]) => `<a href="/admin${v ? '?status=' + v : ''}" class="${filter === v ? 'active' : ''}">${l}</a>`).join('')}
    </div>
    <div class="card">
      ${bookings.length === 0
        ? `<div class="empty">Поки що немає заявок у цій категорії.</div>`
        : `<table>
            <thead><tr><th>Клієнт</th><th>Телефон</th><th>Послуга</th><th>Статус</th><th>Дата</th><th>Дії</th></tr></thead>
            <tbody>${bookings.map(row).join('')}</tbody>
          </table>`}
    </div>
    <p class="muted" style="margin-top:16px">Усього показано: ${bookings.length}</p>
  </div>`;
  return page('Заявки', body);
}

module.exports = { loginPage, dashboardPage, STATUS_LABELS };