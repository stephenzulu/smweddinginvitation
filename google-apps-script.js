/*
 * ══════════════════════════════════════════════════════════════════
 * Stephen & Mutinta — Wedding RSVP
 * Google Apps Script — Deploy as Web App
 *
 * SETUP INSTRUCTIONS:
 * 1. Go to https://script.google.com and create a new project
 * 2. Paste this entire file into Code.gs
 * 3. Run setupSheet() once from the editor (Run > setupSheet)
 * 4. Deploy > New deployment > Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Copy the Web App URL and paste it into wedding.js (API_URL)
 * ══════════════════════════════════════════════════════════════════
 */

const SHEET_NAME = 'Guests';

// Column order (A-N)
const HEADERS = [
  'id', 'name', 'phone', 'email',
  'att1_title', 'att1_name', 'att2_title', 'att2_name',
  'events', 'relation_side', 'relation_type', 'contribution',
  'password', 'registered_at'
];

function setupSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  // Write headers if row 1 is empty
  if (!sheet.getRange('A1').getValue()) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  }
}

function getSheet() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
}

function getAllRows() {
  const sheet = getSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  return sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues();
}

function findByPhone(phone) {
  const rows = getAllRows();
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][2] === phone) {
      const obj = {};
      HEADERS.forEach((h, j) => obj[h] = rows[i][j]);
      obj._rowIndex = i + 2; // sheet row (1-indexed, skip header)
      return obj;
    }
  }
  return null;
}

function nextId() {
  const rows = getAllRows();
  if (!rows.length) return 1;
  return Math.max(...rows.map(r => Number(r[0]) || 0)) + 1;
}

// ── HTTP HANDLERS ─────────────────────────────────────────────────────────

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const params = e.parameter || {};
  const action = params.action || '';

  let result;
  try {
    switch (action) {
      case 'register':
        result = doRegister(params);
        break;
      case 'login':
        result = doLogin(params);
        break;
      case 'checkPhone':
        result = doCheckPhone(params);
        break;
      case 'getAll':
        result = doGetAll();
        break;
      case 'delete':
        result = doDelete(params);
        break;
      case 'count':
        result = doCount();
        break;
      case 'clearAll':
        result = doClearAll();
        break;
      default:
        result = { success: false, error: 'Unknown action: ' + action };
    }
  } catch (err) {
    result = { success: false, error: String(err.message || err || 'Unknown server error') };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── ACTIONS ─────────────────────────────────────────────────────────────

function doRegister(p) {
  // Check for duplicate phone
  if (findByPhone(p.phone)) {
    return { success: false, error: 'duplicate_phone' };
  }

  const id = nextId();
  const row = [
    id,
    p.name || '',
    p.phone || '',
    p.email || '',
    p.att1_title || 'Mr',
    p.att1_name || '',
    p.att2_title || 'Miss',
    p.att2_name || '',
    p.events || 'wedding',
    p.relation_side || 'bride',
    p.relation_type || 'friend',
    p.contribution || '',
    p.password || '',
    p.registered_at || new Date().toISOString()
  ];

  getSheet().appendRow(row);
  return { success: true, id: id, password: p.password };
}

function doLogin(p) {
  const guest = findByPhone(p.phone);
  if (!guest || guest.password !== p.password) {
    return { success: false, error: 'invalid_credentials' };
  }
  return {
    success: true,
    guest: {
      id: guest.id,
      name: guest.name,
      att1_title: guest.att1_title,
      att1_name: guest.att1_name,
      att2_title: guest.att2_title,
      att2_name: guest.att2_name
    }
  };
}

function doCheckPhone(p) {
  const guest = findByPhone(p.phone);
  if (!guest) {
    return { success: false, error: 'not_found' };
  }
  return { success: true, name: guest.name };
}

function doGetAll() {
  const rows = getAllRows();
  const guests = rows.map(r => {
    const obj = {};
    HEADERS.forEach((h, j) => obj[h] = r[j]);
    return obj;
  });
  return { success: true, guests: guests, count: guests.length };
}

function doDelete(p) {
  const guest = findByPhone(p.phone);
  if (!guest) return { success: false, error: 'not_found' };
  getSheet().deleteRow(guest._rowIndex);
  return { success: true };
}

function doCount() {
  return { success: true, count: getAllRows().length };
}

function doClearAll() {
  const sheet = getSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow >= 2) {
    sheet.deleteRows(2, lastRow - 1);
  }
  return { success: true };
}
