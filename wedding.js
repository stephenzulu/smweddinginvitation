/* ══════════════════════════════════════
   Stephen & Mutinta — Wedding RSVP
   wedding.js
══════════════════════════════════════ */

'use strict';

// ── CONFIG ──────────────────────────────────────────────────────────────────
const DB_STORAGE_KEY  = 'wedding_sm_sqlite_2025';

// ── STATE ────────────────────────────────────────────────────────────────────
let db = null;

// ── MONOGRAM LOGO SVG ────────────────────────────────────────────────────────
const LOGO_SVG = `<svg class="logo-svg-inline" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <circle cx="32" cy="32" r="31" fill="#1c1c1e"/>
  <circle cx="32" cy="32" r="28.5" fill="none" stroke="#c9a96e" stroke-width="0.7" opacity="0.55"/>
  <circle cx="32" cy="32" r="24" fill="none" stroke="#c9a96e" stroke-width="0.4" opacity="0.3"/>
  <polygon points="32,3.5 33.4,7 32,10.5 30.6,7" fill="#e8d5b0"/>
  <polygon points="32,53.5 33.4,57 32,60.5 30.6,57" fill="#e8d5b0"/>
  <polygon points="3.5,32 7,30.6 10.5,32 7,33.4" fill="#e8d5b0"/>
  <polygon points="53.5,32 57,30.6 60.5,32 57,33.4" fill="#e8d5b0"/>
  <path d="M7,20 C7,20 4,26 4,31 C4,37 8,40 14,42 C19,44 23,46 23,51 C23,56 19,58 15,58 C11,58 8,55 7.5,51" fill="none" stroke="#e8d5b0" stroke-width="3" stroke-linecap="round"/>
  <line x1="5" y1="20.5" x2="11" y2="20.5" stroke="#e8d5b0" stroke-width="1.4" stroke-linecap="round"/>
  <line x1="4.5" y1="51" x2="10.5" y2="51" stroke="#e8d5b0" stroke-width="1.4" stroke-linecap="round"/>
  <path d="M30,13 L30,51 M30,13 L37,30 L44,13 M44,13 L44,51" fill="none" stroke="#e8d5b0" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  <line x1="27" y1="13" x2="33" y2="13" stroke="#e8d5b0" stroke-width="1.4" stroke-linecap="round"/>
  <line x1="27" y1="51" x2="33" y2="51" stroke="#e8d5b0" stroke-width="1.4" stroke-linecap="round"/>
  <line x1="41" y1="13" x2="47" y2="13" stroke="#e8d5b0" stroke-width="1.4" stroke-linecap="round"/>
  <line x1="41" y1="51" x2="47" y2="51" stroke="#e8d5b0" stroke-width="1.4" stroke-linecap="round"/>
</svg>`;

// ── LOGO INJECTION ───────────────────────────────────────────────────────────
function injectLogos() {
  const placements = [
    { selector: '#page-landing .w-card-header',  size: '80',  mode: 'prepend-wrap' },
    { selector: '#page-register .w-card-header', size: '52',  mode: 'prepend-wrap' },
    { selector: '#page-login .w-card-header',    size: '52',  mode: 'prepend-wrap' },
    { selector: '#page-success .w-card-header',  size: '52',  mode: 'prepend-wrap' },
    { selector: '.details-hero',                 size: '90',  mode: 'hero'         },
    { selector: '.details-navbar .navbar-brand', size: '28',  mode: 'nav'          },
  ];

  placements.forEach(({ selector, size, mode }) => {
    const el = document.querySelector(selector);
    if (!el) return;

    const tmp = document.createElement('div');
    tmp.innerHTML = LOGO_SVG;
    const svg = tmp.querySelector('svg');
    svg.setAttribute('width', size);
    svg.setAttribute('height', size);

    if (mode === 'prepend-wrap') {
      const wrap = document.createElement('div');
      wrap.className = 'logo-wrap';
      wrap.appendChild(svg);
      el.insertBefore(wrap, el.firstChild);
    } else if (mode === 'hero') {
      const wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex;justify-content:center;margin-bottom:18px;';
      wrap.appendChild(svg);
      el.insertBefore(wrap, el.firstChild);
    } else if (mode === 'nav') {
      const span = document.createElement('span');
      span.style.cssText = 'display:inline-block;vertical-align:middle;margin-right:8px;';
      span.appendChild(svg);
      el.insertBefore(span, el.firstChild);
    }
  });
}

// ── DATABASE ─────────────────────────────────────────────────────────────────
async function initDB() {
  try {
    const SQL = await initSqlJs({
      locateFile: f => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.2/${f}`
    });

    const saved = localStorage.getItem(DB_STORAGE_KEY);
    db = saved
      ? new SQL.Database(Uint8Array.from(atob(saved), c => c.charCodeAt(0)))
      : new SQL.Database();

    db.run(`
      CREATE TABLE IF NOT EXISTS guests (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        name          TEXT NOT NULL,
        phone         TEXT NOT NULL UNIQUE,
        email         TEXT NOT NULL,
        att1_title    TEXT NOT NULL DEFAULT 'Mr',
        att1_name     TEXT NOT NULL DEFAULT '',
        att2_title    TEXT NOT NULL DEFAULT 'Miss',
        att2_name     TEXT NOT NULL DEFAULT '',
        events        TEXT NOT NULL DEFAULT 'wedding',
        relation_side TEXT NOT NULL DEFAULT 'bride',
        relation_type TEXT NOT NULL DEFAULT 'friend',
        contribution  TEXT NOT NULL DEFAULT 'money',
        password      TEXT NOT NULL,
        registered_at TEXT NOT NULL
      )
    `);

    // ── SCHEMA MIGRATION ──────────────────────────────────────────────────────
    // If the table already existed from an older schema, ALTER TABLE to add any
    // missing columns non-destructively.
    const existingCols = db.exec(`PRAGMA table_info(guests)`)[0]?.values
      .map(row => row[1]) ?? [];
    const needed = [
      ["att1_title",    "TEXT NOT NULL DEFAULT 'Mr'"],
      ["att1_name",     "TEXT NOT NULL DEFAULT ''"],
      ["att2_title",    "TEXT NOT NULL DEFAULT 'Miss'"],
      ["att2_name",     "TEXT NOT NULL DEFAULT ''"],
      ["events",        "TEXT NOT NULL DEFAULT 'wedding'"],
      ["relation_side", "TEXT NOT NULL DEFAULT 'bride'"],
      ["relation_type", "TEXT NOT NULL DEFAULT 'friend'"],
      ["contribution",  "TEXT NOT NULL DEFAULT 'money'"],
    ];
    needed.forEach(([col, def]) => {
      if (!existingCols.includes(col)) {
        db.run(`ALTER TABLE guests ADD COLUMN ${col} ${def}`);
      }
    });
    // ─────────────────────────────────────────────────────────────────────────

    persistDB();

    // Hide loading screen
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.classList.add('hidden');

    // Update DB status bar safely
    const statusEl = document.getElementById('db-status-text');
    if (statusEl) statusEl.textContent =
      `SQLite database active · ${queryCount()} guest(s) stored in localStorage`;

    injectLogos();

  } catch (err) {
    console.error('initDB failed:', err);
    const loaderText = document.querySelector('.loader-text');
    if (loaderText) loaderText.textContent = 'DB Error — ' + err.message;
  }
}

function persistDB() {
  if (!db) return;
  localStorage.setItem(DB_STORAGE_KEY, btoa(String.fromCharCode(...db.export())));
}

function queryCount() {
  return db.exec('SELECT COUNT(*) FROM guests')[0]?.values[0][0] ?? 0;
}

// ── NAVIGATION ───────────────────────────────────────────────────────────────
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id)?.classList.add('active');
  window.scrollTo(0, 0);
}

// ── HELPERS ──────────────────────────────────────────────────────────────────
function normalizePhone(p) {
  return p.replace(/[\s\-\(\)\+]/g, '');
}

function genPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#!';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function showError(elId, msg) {
  const el = document.getElementById(elId);
  el.textContent = msg;
  el.className = 'msg error show';
}

function clearMsg(elId) {
  const el = document.getElementById(elId);
  el.className = 'msg error';
  el.textContent = '';
}

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function togglePwd(inputId, btn) {
  const input = document.getElementById(inputId);
  const icon  = btn.querySelector('i');
  if (input.type === 'password') {
    input.type = 'text';
    icon.className = 'bi bi-eye-slash';
  } else {
    input.type = 'password';
    icon.className = 'bi bi-eye';
  }
}

// ── REGISTER ──────────────────────────────────────────────────────────────────
function handleRegister() {
  clearMsg('reg-error');

  const phone        = document.getElementById('reg-phone').value.trim();
  const email        = document.getElementById('reg-email').value.trim();
  const att1Title    = document.getElementById('att1-title').value;
  const att1Name     = document.getElementById('att1-name').value.trim();
  const att2Title    = document.getElementById('att2-title').value;
  const att2Name     = document.getElementById('att2-name').value.trim();
  const bringingGift    = document.querySelector('input[name="bringing-gift"]:checked')?.value || 'no';
  const giftDescription = document.getElementById('reg-gift-description')?.value.trim() || '';
  const contribution    = bringingGift === 'yes' ? ('gift: ' + giftDescription) : '';

  // Events attending — wedding-only site, defaults to 'wedding'
  const eventsArr = Array.from(document.querySelectorAll('input[name="events"]:checked'))
    .map(el => el.value);
  const events = eventsArr.length ? eventsArr.join(',') : 'wedding';

  const relationSide = document.querySelector('input[name="relation-side"]:checked')?.value || 'bride';
  const relationType = document.getElementById('reg-relation-type').value || 'friend';

  // ── Validation (phone + email required, valid email format) ──
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!phone)                  return showError('reg-error', 'Please enter your phone number.');
  if (!email)                  return showError('reg-error', 'Please enter your email address.');
  if (!EMAIL_RE.test(email))   return showError('reg-error', 'Please enter a valid email address (e.g. you@example.com).');
  if (!att1Name)               return showError('reg-error', 'Please enter the name of the first attendee.');
  if (!att2Name)               return showError('reg-error', 'Please enter the name of the second attendee.');
  if (!eventsArr.length)       return showError('reg-error', 'Please select at least one event you will attend.');

  // Derive the contact-person "name" from Attendee 1 (Title + Name)
  // — used for greetings, emails, admin display.
  const name = `${att1Title} ${att1Name}`.trim();

  const normPhone = normalizePhone(phone);

  // ── Prevent duplicate phone numbers ────────────────────────────────────────
  const existing  = db.exec('SELECT id FROM guests WHERE phone = ?', [normPhone]);
  if (existing.length && existing[0].values.length)
    return showError('reg-error', 'This phone number has already reserved a date. Please use a different number, or contact us if you need to update your reservation.');

  const password = genPassword();

  try {
    db.run(
      `INSERT INTO guests
         (name, phone, email, att1_title, att1_name, att2_title, att2_name,
          events, relation_side, relation_type, contribution, password, registered_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, normPhone, email, att1Title, att1Name, att2Title, att2Name,
       events, relationSide, relationType, contribution, password, new Date().toISOString()]
    );
    persistDB();
  } catch (err) {
    // Catch DB-level UNIQUE constraint violation as a safety net
    const msg = String(err.message || '');
    if (/UNIQUE.*phone/i.test(msg)) {
      return showError('reg-error', 'This phone number has already reserved a date. Please use a different number.');
    }
    return showError('reg-error', 'Reservation failed: ' + msg);
  }

  ['reg-phone', 'reg-email', 'att1-name', 'att2-name'].forEach(id => {
    document.getElementById(id).value = '';
  });

  const successPwdEl = document.getElementById('success-pwd');
  if (successPwdEl) successPwdEl.textContent = password;
  const emailStatusBox = document.getElementById('email-status-box');
  if (emailStatusBox) emailStatusBox.innerHTML = '';
  showPage('page-success');
}

// ── LOGIN ─────────────────────────────────────────────────────────────────────
function handleLogin() {
  clearMsg('login-error');

  const phone = normalizePhone(document.getElementById('login-phone').value.trim());
  const pwd   = document.getElementById('login-password').value.trim();

  if (!phone) return showError('login-error', 'Please enter your phone number.');
  if (!pwd)   return showError('login-error', 'Please enter your password.');

  const res = db.exec(
    'SELECT id, name, att1_title, att1_name, att2_title, att2_name FROM guests WHERE phone = ? AND password = ?',
    [phone, pwd]
  );

  if (!res.length || !res[0].values.length)
    return showError('login-error', 'Incorrect phone number or password. Please try again.');

  const [id, name, att1Title, att1Name, att2Title, att2Name] = res[0].values[0];

  // Populate details page
  document.getElementById('nav-user-name').textContent      = 'Welcome, ' + name.split(' ')[0];
  document.getElementById('detail-guest-name').textContent  = name;
  document.getElementById('detail-att1-title').textContent  = att1Title || 'Mr';
  document.getElementById('detail-att1-name').textContent   = att1Name  || '—';
  document.getElementById('detail-att2-title').textContent  = att2Title || 'Miss';
  document.getElementById('detail-att2-name').textContent   = att2Name  || '—';

  document.getElementById('att1-avatar').textContent = ['Mrs','Miss'].includes(att1Title) ? '👗' : '🤵';
  document.getElementById('att2-avatar').textContent = ['Mrs','Miss'].includes(att2Title) ? '👗' : '🤵';

  // Simple "Registered" confirmation badge (used to be money/gift)
  const badge = document.getElementById('detail-contribution-badge');
  if (badge) {
    badge.textContent = '✓ RSVP Confirmed';
    badge.className   = 'contribution-badge';
  }

  document.getElementById('login-phone').value    = '';
  document.getElementById('login-password').value = '';
  showPage('page-details');
}

function handleLogout() {
  showPage('page-landing');
}

// ── PETALS ───────────────────────────────────────────────────────────────────
function initPetals() {
  const container = document.getElementById('petals');
  if (!container) return; // nothing to do if the container isn't on the page
  for (let i = 0; i < 18; i++) {
    const petal = document.createElement('div');
    petal.className = 'petal';
    const sz = 6 + Math.random() * 8;
    petal.style.cssText = [
      `left:${Math.random() * 100}%`,
      `width:${sz}px`,
      `height:${sz * 1.4}px`,
      `animation-duration:${9 + Math.random() * 12}s`,
      `animation-delay:${Math.random() * 14}s`,
      `border-radius:${Math.random() > .5 ? '50% 50% 50% 0' : '50% 0 50% 50%'}`,
    ].join(';');
    container.appendChild(petal);
  }
}

// ── PROGRAMME GATE ───────────────────────────────────────────────────────
function handleViewProgramme() {
  const errorEl = document.getElementById('prog-error');
  errorEl.className = 'msg error';
  errorEl.textContent = '';

  const phone = normalizePhone(document.getElementById('prog-phone').value.trim());
  if (!phone) {
    errorEl.textContent = 'Please enter your phone number.';
    errorEl.className = 'msg error show';
    return;
  }

  const res = db.exec('SELECT name FROM guests WHERE phone = ?', [phone]);
  if (!res.length || !res[0].values.length) {
    errorEl.textContent = 'This phone number has not reserved a date. Please reserve first, then come back to view the programme.';
    errorEl.className = 'msg error show';
    return;
  }

  const name = res[0].values[0][0];
  document.getElementById('prog-guest-name').textContent = name;
  document.getElementById('programme-gate').style.display = 'none';
  document.getElementById('programme-content').style.display = '';
}

function handleLockProgramme() {
  document.getElementById('programme-content').style.display = 'none';
  document.getElementById('programme-gate').style.display = '';
  document.getElementById('prog-phone').value = '';
}

// ── GIFT TOGGLE ──────────────────────────────────────────────────────────
document.addEventListener('change', function(e) {
  if (e.target.name === 'bringing-gift') {
    const wrap = document.getElementById('gift-description-wrap');
    if (wrap) wrap.style.display = e.target.value === 'yes' ? '' : 'none';
  }
});

// ── BOOT ─────────────────────────────────────────────────────────────────────
initPetals();
initDB();

// Safety net: force-hide the loading overlay after 5s no matter what,
// so a slow/failed CDN load never permanently blocks the UI.
setTimeout(() => {
  const overlay = document.getElementById('loading-overlay');
  if (overlay && !overlay.classList.contains('hidden')) {
    overlay.classList.add('hidden');
  }
}, 5000);