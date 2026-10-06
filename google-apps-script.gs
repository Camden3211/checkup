/*
  FINANCIAL CHECKUP: Google Sheets receiver
  Paste this whole file into Extensions > Apps Script inside your Google Sheet (README, Step 2).

  Each checkup gets its own tab (e.g. "pool-owner"). Columns are created automatically,
  and if you add a question later, its column is added on the right.
*/

// ====== SETTINGS ======
const NOTIFY_EMAIL = '';      // leave blank to email the Google account that owns this script
const EMAIL_ON = 'all';       // 'all' = email on every submission, 'followup' = only people who asked for follow-up, 'none' = no emails
const TRACKING_COLUMNS = ['Status', 'Contacted?', 'Meeting booked?', 'Est. AUM', 'Notes']; // for you to fill in by hand
// ======================

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const data = JSON.parse(e.postData.contents);
    if (data.website) return reply({ ok: true }); // spam trap was filled in, so drop it quietly
    delete data.website;

    const row = Object.assign({ Timestamp: new Date() }, data);
    const sheet = getTab(String(data.Assessment || 'submissions'));
    appendRow(sheet, row);
    notify(row);
    return reply({ ok: true });
  } catch (err) {
    console.error(err);
    return reply({ ok: false });
  } finally {
    lock.releaseLock();
  }
}

// Lets you check the deployment: open the Web app URL in a browser and you should see this message.
function doGet() {
  return ContentService.createTextOutput('Checkup endpoint is running.');
}

function getTab(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const clean = name.replace(/[^\w -]/g, '').slice(0, 50) || 'submissions';
  let sheet = ss.getSheetByName(clean);
  if (!sheet) {
    sheet = ss.insertSheet(clean);
    sheet.appendRow(['Timestamp'].concat(TRACKING_COLUMNS));
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, sheet.getLastColumn()).setFontWeight('bold');
  }
  return sheet;
}

function appendRow(sheet, row) {
  let headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const missing = Object.keys(row).filter((k) => headers.indexOf(k) === -1);
  if (missing.length) {
    sheet.getRange(1, headers.length + 1, 1, missing.length).setValues([missing]).setFontWeight('bold');
    headers = headers.concat(missing);
  }
  const values = headers.map((h) => (h in row ? safe(row[h]) : ''));
  sheet.appendRow(values);
}

// Stops anything typed into the form from being treated as a spreadsheet formula.
function safe(v) {
  if (v instanceof Date || typeof v === 'number') return v;
  const s = String(v == null ? '' : v).slice(0, 1000);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function notify(row) {
  if (EMAIL_ON === 'none') return;
  const wants = row['Wants follow-up'] === 'Yes';
  if (EMAIL_ON === 'followup' && !wants) return;
  try {
    const to = NOTIFY_EMAIL || Session.getEffectiveUser().getEmail();
    const name = [row['First name'], row['Last name']].filter(String).join(' ') || 'Someone';
    const sizing = [row['Invested outside business'], row['Investments managed by'], row['Extra business cash'] && 'biz cash ' + row['Extra business cash']]
      .filter((s) => s && s.indexOf('Prefer not') === -1)
      .join(' · ');
    const subject = 'Checkup: ' + name + (sizing ? ' · ' + sizing : '') + (wants ? ' (WANTS FOLLOW-UP)' : ' (results only)');
    const lines = Object.keys(row)
      .filter((k) => k !== 'Timestamp' && row[k] !== '')
      .map((k) => k + ': ' + row[k]);
    MailApp.sendEmail(to, subject, lines.join('\n'));
  } catch (err) {
    console.error('Email failed', err);
  }
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// Run this once from the editor (README, Step 2) to grant permissions and create a test row.
function testSetup() {
  const fake = {
    postData: {
      contents: JSON.stringify({
        Assessment: 'pool-owner',
        Source: 'test',
        'First name': 'Test',
        'Last name': 'Row',
        'Wants follow-up': 'No',
        Result: 'This is a test. Delete this row.',
      }),
    },
  };
  doPost(fake);
}
