/* ══════════════════════════════════════
   Stephen & Mutinta — Wedding RSVP
   admin.js  |  Admin Portal — Google Sheets Backend
══════════════════════════════════════ */
'use strict';

// ── CONFIG ───────────────────────────────────────────────────────────────────
// ⚠️ PASTE YOUR DEPLOYED GOOGLE APPS SCRIPT WEB APP URL HERE:
const API_URL           = 'https://script.google.com/macros/s/AKfycbyVl8rRE9XivaIPOjoONLlr6YtSRn91LCJEtx5SBf3JaN32do2DF2KbMC3M1d-roUf1/exec';
const ADMIN_PASSWORD    = 'admin2025';
const VIEWER_PASSWORD   = 'admin2026';

let isAdmin = false;

// ── API HELPER ──────────────────────────────────────────────────────────────
async function apiCall(params) {
  const url = API_URL + '?' + new URLSearchParams(params).toString();
  const res = await fetch(url, { redirect: 'follow' });
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error('API response was not JSON:', text);
    throw new Error('Invalid response from server');
  }
}

// ── INIT ─────────────────────────────────────────────────────────────────────
async function initApp() {
  try {
    await apiCall({ action: 'count' });
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.classList.add('hidden');
  } catch (err) {
    console.error('initApp failed:', err);
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.classList.add('hidden');
  }
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
  if (!pwd) return showError('admin-login-error', 'Please enter the password.');
  if (pwd !== ADMIN_PASSWORD && pwd !== VIEWER_PASSWORD)
    return showError('admin-login-error', 'Incorrect password. Access denied.');

  isAdmin = (pwd === ADMIN_PASSWORD);

  // Show/hide admin-only buttons
  document.querySelectorAll('.admin-only').forEach(el => {
    el.style.display = isAdmin ? '' : 'none';
  });

  document.getElementById('admin-password').value = '';
  showView('view-panel');
  renderAdminPanel();
}

// ── RENDER PANEL ─────────────────────────────────────────────────────────────
async function renderAdminPanel() {
  const statsEl = document.getElementById('admin-stats');
  const tbodyEl = document.getElementById('admin-tbody');
  const statusEl = document.getElementById('db-status-text');

  statsEl.innerHTML = `<div class="col-12"><div class="stat-bs-card" style="color:#666;">
    <i class="bi bi-hourglass-split me-2"></i>Loading data from Google Sheets...
  </div></div>`;

  try {
    const result = await apiCall({ action: 'getAll' });
    if (!result.success) throw new Error(result.error);

    const rows  = result.guests;
    const total = rows.length;

    const brideSide = rows.filter(r => r.relation_side === 'bride').length;
    const groomSide = rows.filter(r => r.relation_side === 'groom').length;

    statsEl.innerHTML = `
      <div class="col-6 col-md-4"><div class="stat-bs-card"><div class="stat-bs-num">${total}</div><div class="stat-bs-label">Total Guests</div></div></div>
      <div class="col-6 col-md-4"><div class="stat-bs-card"><div class="stat-bs-num" style="color:#c99969;">${brideSide}</div><div class="stat-bs-label">Bride's Side</div></div></div>
      <div class="col-12 col-md-4"><div class="stat-bs-card"><div class="stat-bs-num" style="color:#6D8A91;">${groomSide}</div><div class="stat-bs-label">Groom's Side</div></div></div>`;

    if (statusEl) statusEl.textContent = `Google Sheets · ${total} guest(s)`;

    if (!rows.length) {
      tbodyEl.innerHTML =
        `<tr><td colspan="8" class="text-center fst-italic py-4" style="color:#444;">No guests registered yet.</td></tr>`;
      return;
    }

    tbodyEl.innerHTML = rows.map((r, i) => {
      const d = r.registered_at ? new Date(r.registered_at).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) : '—';
      const sideBadge = r.relation_side === 'groom'
        ? `<span class="badge badge-groom px-2 py-1">🤵 Groom's</span>`
        : `<span class="badge badge-bride px-2 py-1">👰 Bride's</span>`;
      const relTypeLabel = (r.relation_type || 'friend').charAt(0).toUpperCase() + (r.relation_type || 'friend').slice(1);

      const deleteBtn = isAdmin
        ? `<button class="btn btn-sm btn-outline-danger"
            style="font-size:11px;white-space:nowrap;"
            onclick="deleteGuest('${esc(r.phone)}')">
            <i class="bi bi-trash"></i>
          </button>`
        : '';

      return `<tr>
        <td style="color:#555;">${i+1}</td>
        <td>${esc(r.phone)}</td>
        <td style="font-size:13px;">${esc(r.email)}</td>
        <td style="white-space:nowrap;"><span style="color:var(--gold);font-size:11px;">${esc(r.att1_title)}</span> ${esc(r.att1_name)}</td>
        <td style="white-space:nowrap;"><span style="color:var(--gold);font-size:11px;">${esc(r.att2_title)}</span> ${esc(r.att2_name)}</td>
        <td style="white-space:nowrap;">${sideBadge}<br><span style="font-size:11px;color:#888;font-style:italic;">${esc(relTypeLabel)}</span></td>
        <td style="color:#666;font-size:12px;">${d}</td>
        <td>${deleteBtn}</td>
      </tr>`;
    }).join('');

  } catch (err) {
    statsEl.innerHTML = `<div class="col-12"><div class="stat-bs-card" style="color:#dc3545;">
      <i class="bi bi-exclamation-triangle me-2"></i>Failed to load data: ${esc(err.message)}
    </div></div>`;
    console.error('renderAdminPanel error:', err);
  }
}

// ── DELETE GUEST ──────────────────────────────────────────────────────────────
async function deleteGuest(guestPhone) {
  if (!confirm(`Remove the guest with phone number "${guestPhone}" from the registry?\nThis cannot be undone.`)) return;

  try {
    await apiCall({ action: 'delete', phone: guestPhone });
    renderAdminPanel();
  } catch (err) {
    alert('Failed to delete: ' + err.message);
  }
}

// ── EXPORT CSV ────────────────────────────────────────────────────────────────
async function exportCSV() {
  try {
    const result = await apiCall({ action: 'getAll' });
    if (!result.success || !result.guests.length) return alert('No guests to export.');

    const headers = ['Phone','Email','Att1 Title','Att1 Name','Att2 Title','Att2 Name','Relation Side','Relation Type','Contribution','Registered At'];
    const csvRows = result.guests.map(r => [
      r.phone, r.email, r.att1_title, r.att1_name, r.att2_title, r.att2_name,
      r.relation_side, r.relation_type, r.contribution, r.registered_at
    ].map(v => `"${String(v || '').replace(/"/g,'\\"')}"`));

    const csv = [headers, ...csvRows].map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = 'wedding_guests_sm_2026.csv';
    a.click();
  } catch (err) {
    alert('Export failed: ' + err.message);
  }
}

// ── CLEAR DATA ────────────────────────────────────────────────────────────────
async function clearAllData() {
  if (!confirm('⚠️ Delete ALL guest records permanently? This cannot be undone.')) return;
  try {
    await apiCall({ action: 'clearAll' });
    renderAdminPanel();
  } catch (err) {
    alert('Clear failed: ' + err.message);
  }
}

// ── LOGOUT ────────────────────────────────────────────────────────────────────
function handleLogout() {
  showView('view-login');
}

// ── BOOT ─────────────────────────────────────────────────────────────────────
initApp();

// Safety: force-hide loading overlay after 5s
setTimeout(() => {
  const overlay = document.getElementById('loading-overlay');
  if (overlay && !overlay.classList.contains('hidden')) overlay.classList.add('hidden');
}, 5000);
