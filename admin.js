/* ══════════════════════════════════════
   Stephen & Mutinta — Wedding RSVP
   admin.js  |  Admin Portal Only
══════════════════════════════════════ */
'use strict';

// ── CONFIG ───────────────────────────────────────────────────────────────────
const DB_STORAGE_KEY    = 'wedding_sm_sqlite_2025';
const ADMIN_PASSWORD    = 'admin2025';

// ── STATE ────────────────────────────────────────────────────────────────────
let db = null;

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

    db.run(`CREATE TABLE IF NOT EXISTS guests (
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
    )`);

    // ── SCHEMA MIGRATION ─────────────────────────────────────────────────────
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
      if (!existingCols.includes(col)) db.run(`ALTER TABLE guests ADD COLUMN ${col} ${def}`);
    });
    // ─────────────────────────────────────────────────────────────────────────

    // Hide loading overlay
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.classList.add('hidden');

    // Update status bar
    const statusEl = document.getElementById('db-status-text');
    if (statusEl) statusEl.textContent =
      `SQLite active · ${queryCount()} guest(s) · localStorage`;

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

// ── HELPERS ──────────────────────────────────────────────────────────────────
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
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function togglePwd(inputId, btn) {
  const input = document.getElementById(inputId);
  const icon  = btn.querySelector('i');
  if (input.type === 'password') { input.type = 'text'; icon.className = 'bi bi-eye-slash'; }
  else { input.type = 'password'; icon.className = 'bi bi-eye'; }
}
function showView(id) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(id)?.classList.add('active');
  window.scrollTo(0, 0);
}

// ── ADMIN LOGIN ───────────────────────────────────────────────────────────────
function handleAdminLogin() {
  clearMsg('admin-login-error');
  const pwd = document.getElementById('admin-password').value.trim();
  if (!pwd) return showError('admin-login-error', 'Please enter the admin password.');
  if (pwd !== ADMIN_PASSWORD)
    return showError('admin-login-error', 'Incorrect password. Access denied.');

  document.getElementById('admin-password').value = '';
  showView('view-panel');
  if (db) {
    renderAdminPanel();
  } else {
    document.getElementById('admin-stats').innerHTML =
      `<div class="col-12"><div class="stat-bs-card" style="color:#666;">
        <i class="bi bi-hourglass-split me-2"></i>Database loading — click Refresh in a moment.
      </div></div>`;
    document.getElementById('admin-tbody').innerHTML =
      `<tr><td colspan="9" class="text-center fst-italic py-4" style="color:#444;">Please wait and click Refresh.</td></tr>`;
  }
}

// ── RENDER PANEL ─────────────────────────────────────────────────────────────
function renderAdminPanel() {
  if (!db) return;
  const res  = db.exec(
    'SELECT id,name,phone,email,att1_title,att1_name,att2_title,att2_name,events,relation_side,relation_type,registered_at FROM guests ORDER BY id'
  );
  const rows  = res.length ? res[0].values : [];
  const total = rows.length;

  // Relation-side split (relation_side at index 9)
  const brideSide = rows.filter(r => r[9] === 'bride').length;
  const groomSide = rows.filter(r => r[9] === 'groom').length;

  document.getElementById('admin-stats').innerHTML = `
    <div class="col-6 col-md-4"><div class="stat-bs-card"><div class="stat-bs-num">${total}</div><div class="stat-bs-label">Total Guests</div></div></div>
    <div class="col-6 col-md-4"><div class="stat-bs-card"><div class="stat-bs-num" style="color:#c99969;">${brideSide}</div><div class="stat-bs-label">Bride's Side</div></div></div>
    <div class="col-12 col-md-4"><div class="stat-bs-card"><div class="stat-bs-num" style="color:#6D8A91;">${groomSide}</div><div class="stat-bs-label">Groom's Side</div></div></div>`;

  const statusEl = document.getElementById('db-status-text');
  if (statusEl) statusEl.textContent = `SQLite active · ${total} guest(s) · localStorage`;

  if (!rows.length) {
    document.getElementById('admin-tbody').innerHTML =
      `<tr><td colspan="8" class="text-center fst-italic py-4" style="color:#444;">No guests registered yet.</td></tr>`;
    return;
  }

  document.getElementById('admin-tbody').innerHTML = rows.map((r, i) => {
    const [id,name,phone,email,a1t,a1n,a2t,a2n,events,relSide,relType,regAt] = r;
    const d = regAt ? new Date(regAt).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) : '—';

    // Relation
    const sideBadge = relSide === 'groom'
      ? `<span class="badge badge-groom px-2 py-1">🤵 Groom's</span>`
      : `<span class="badge badge-bride px-2 py-1">👰 Bride's</span>`;
    const relTypeLabel = (relType || 'friend').charAt(0).toUpperCase() + (relType || 'friend').slice(1);

    return `<tr>
      <td style="color:#555;">${i+1}</td>
      <td>${esc(phone)}</td>
      <td style="font-size:13px;">${esc(email)}</td>
      <td style="white-space:nowrap;"><span style="color:var(--gold);font-size:11px;">${esc(a1t)}</span> ${esc(a1n)}</td>
      <td style="white-space:nowrap;"><span style="color:var(--gold);font-size:11px;">${esc(a2t)}</span> ${esc(a2n)}</td>
      <td style="white-space:nowrap;">${sideBadge}<br><span style="font-size:11px;color:#888;font-style:italic;">${esc(relTypeLabel)}</span></td>
      <td style="color:#666;font-size:12px;">${d}</td>
      <td>
        <button class="btn btn-sm btn-outline-danger"
          style="font-size:11px;white-space:nowrap;"
          onclick="deleteGuest(${id}, '${esc(phone)}')">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    </tr>`;
  }).join('');
}

// ── DELETE GUEST ──────────────────────────────────────────────────────────────
function deleteGuest(guestId, guestPhone) {
  if (!db) return;
  if (!confirm(`Remove the guest with phone number "${guestPhone}" from the registry?\nThis cannot be undone.`)) return;
  db.run('DELETE FROM guests WHERE id = ?', [guestId]);
  persistDB();
  renderAdminPanel();
}

// ── EXPORT CSV ────────────────────────────────────────────────────────────────
function exportCSV() {
  if (!db) return alert('Database not ready.');
  const res = db.exec('SELECT phone,email,att1_title,att1_name,att2_title,att2_name,relation_side,relation_type,registered_at FROM guests ORDER BY id');
  if (!res.length || !res[0].values.length) return alert('No guests to export.');
  const headers = ['Phone','Email','Att1 Title','Att1 Name','Att2 Title','Att2 Name','Relation Side','Relation Type','Registered At'];
  const csv = [headers, ...res[0].values.map(r => r.map(v => `"${String(v).replace(/"/g,'\\"')}"`))]
    .map(r => r.join(',')).join('\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = 'wedding_guests_sm_2026.csv';
  a.click();
}

// ── CLEAR DATA ────────────────────────────────────────────────────────────────
function clearAllData() {
  if (!db) return alert('Database not ready.');
  if (!confirm('⚠️ Delete ALL guest records permanently? This cannot be undone.')) return;
  db.run('DELETE FROM guests');
  persistDB();
  renderAdminPanel();
}

// ── LOGOUT ────────────────────────────────────────────────────────────────────
function handleLogout() {
  showView('view-login');
}

// ── BOOT ─────────────────────────────────────────────────────────────────────
initDB();

// Safety: force-hide loading overlay after 5s
setTimeout(() => {
  const overlay = document.getElementById('loading-overlay');
  if (overlay && !overlay.classList.contains('hidden')) overlay.classList.add('hidden');
}, 5000);