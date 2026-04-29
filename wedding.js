/* ══════════════════════════════════════
   Stephen & Mutinta — Wedding RSVP
   wedding.js  |  Google Sheets Backend
══════════════════════════════════════ */

'use strict';

// ── CONFIG ──────────────────────────────────────────────────────────────────
// ⚠️ PASTE YOUR DEPLOYED GOOGLE APPS SCRIPT WEB APP URL HERE:
const API_URL = 'https://script.google.com/macros/s/AKfycbyVl8rRE9XivaIPOjoONLlr6YtSRn91LCJEtx5SBf3JaN32do2DF2KbMC3M1d-roUf1/exec';

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

// ── API HELPER ──────────────────────────────────────────────────────────────
async function apiCall(params) {
  const url = new URL(API_URL);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Network error: ' + res.status);
  return res.json();
}

// ── INIT ─────────────────────────────────────────────────────────────────────
async function initApp() {
  try {
    // Quick connectivity check
    await apiCall({ action: 'count' });

    // Hide loading screen
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.classList.add('hidden');

    injectLogos();

  } catch (err) {
    console.error('initApp failed:', err);
    // Still hide overlay so site is usable
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.classList.add('hidden');
    injectLogos();
  }
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
async function handleRegister() {
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

  const events = 'wedding';

  const relationSide = document.querySelector('input[name="relation-side"]:checked')?.value || 'bride';
  const relationType = document.getElementById('reg-relation-type').value || 'friend';

  // ── Validation ──
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!phone)                  return showError('reg-error', 'Please enter your phone number.');
  if (!email)                  return showError('reg-error', 'Please enter your email address.');
  if (!EMAIL_RE.test(email))   return showError('reg-error', 'Please enter a valid email address (e.g. you@example.com).');
  if (!att1Name)               return showError('reg-error', 'Please enter the name of the first attendee.');
  if (!att2Name)               return showError('reg-error', 'Please enter the name of the second attendee.');

  const name = `${att1Title} ${att1Name}`.trim();
  const normPhone = normalizePhone(phone);
  const password = genPassword();

  // Disable button while submitting
  const btn = document.querySelector('#rsvp-pane-register .btn-wedding');
  if (btn) { btn.disabled = true; btn.textContent = 'Reserving...'; }

  try {
    const result = await apiCall({
      action: 'register',
      name, phone: normPhone, email,
      att1_title: att1Title, att1_name: att1Name,
      att2_title: att2Title, att2_name: att2Name,
      events, relation_side: relationSide,
      relation_type: relationType, contribution,
      password, registered_at: new Date().toISOString()
    });

    if (!result.success) {
      if (result.error === 'duplicate_phone') {
        return showError('reg-error', 'This phone number has already reserved a date. Please use a different number, or contact us if you need to update your reservation.');
      }
      return showError('reg-error', 'Reservation failed: ' + result.error);
    }

    ['reg-phone', 'reg-email', 'att1-name', 'att2-name'].forEach(id => {
      document.getElementById(id).value = '';
    });

    const successPwdEl = document.getElementById('success-pwd');
    if (successPwdEl) successPwdEl.textContent = password;
    const emailStatusBox = document.getElementById('email-status-box');
    if (emailStatusBox) emailStatusBox.innerHTML = '';
    showPage('page-success');

  } catch (err) {
    showError('reg-error', 'Connection error. Please check your internet and try again.');
    console.error('Register error:', err);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Reserve'; }
  }
}

// ── LOGIN ─────────────────────────────────────────────────────────────────────
async function handleLogin() {
  clearMsg('login-error');

  const phone = normalizePhone(document.getElementById('login-phone').value.trim());
  const pwd   = document.getElementById('login-password').value.trim();

  if (!phone) return showError('login-error', 'Please enter your phone number.');
  if (!pwd)   return showError('login-error', 'Please enter your password.');

  try {
    const result = await apiCall({ action: 'login', phone, password: pwd });

    if (!result.success) {
      return showError('login-error', 'Incorrect phone number or password. Please try again.');
    }

    const { name, att1_title, att1_name, att2_title, att2_name } = result.guest;

    document.getElementById('nav-user-name').textContent      = 'Welcome, ' + name.split(' ')[0];
    document.getElementById('detail-guest-name').textContent  = name;
    document.getElementById('detail-att1-title').textContent  = att1_title || 'Mr';
    document.getElementById('detail-att1-name').textContent   = att1_name  || '—';
    document.getElementById('detail-att2-title').textContent  = att2_title || 'Miss';
    document.getElementById('detail-att2-name').textContent   = att2_name  || '—';

    document.getElementById('att1-avatar').textContent = ['Mrs','Miss'].includes(att1_title) ? '👗' : '🤵';
    document.getElementById('att2-avatar').textContent = ['Mrs','Miss'].includes(att2_title) ? '👗' : '🤵';

    const badge = document.getElementById('detail-contribution-badge');
    if (badge) {
      badge.textContent = '✓ RSVP Confirmed';
      badge.className   = 'contribution-badge';
    }

    document.getElementById('login-phone').value    = '';
    document.getElementById('login-password').value = '';
    showPage('page-details');

  } catch (err) {
    showError('login-error', 'Connection error. Please check your internet and try again.');
    console.error('Login error:', err);
  }
}

function handleLogout() {
  showPage('page-landing');
}

// ── PETALS ───────────────────────────────────────────────────────────────────
function initPetals() {
  const container = document.getElementById('petals');
  if (!container) return;
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
async function handleViewProgramme() {
  const errorEl = document.getElementById('prog-error');
  errorEl.className = 'msg error';
  errorEl.textContent = '';

  const phone = normalizePhone(document.getElementById('prog-phone').value.trim());
  if (!phone) {
    errorEl.textContent = 'Please enter your phone number.';
    errorEl.className = 'msg error show';
    return;
  }

  try {
    const result = await apiCall({ action: 'checkPhone', phone });

    if (!result.success) {
      errorEl.textContent = 'This phone number has not reserved a date. Please reserve first, then come back to view the programme.';
      errorEl.className = 'msg error show';
      return;
    }

    document.getElementById('prog-guest-name').textContent = result.name;
    document.getElementById('programme-gate').style.display = 'none';
    document.getElementById('programme-content').style.display = '';

  } catch (err) {
    errorEl.textContent = 'Connection error. Please check your internet and try again.';
    errorEl.className = 'msg error show';
    console.error('Programme check error:', err);
  }
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
initApp();

// Safety net: force-hide the loading overlay after 5s no matter what
setTimeout(() => {
  const overlay = document.getElementById('loading-overlay');
  if (overlay && !overlay.classList.contains('hidden')) {
    overlay.classList.add('hidden');
  }
}, 5000);
