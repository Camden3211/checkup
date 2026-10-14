/*
  FINANCIAL CHECKUP: Google Sheets receiver
  Paste this whole file into Extensions > Apps Script inside your Google Sheet (README, Step 2).

  Each checkup gets its own tab (e.g. "pool-owner"). Columns are created automatically,
  and if you add a question later, its column is added on the right.
  The "Activity" tab gets one row per visit showing how far they got, including people who never finish.
*/

// ====== SETTINGS ======
const NOTIFY_EMAIL = '';      // leave blank to email the Google account that owns this script
const EMAIL_ON = 'all';       // 'all' = email on every submission, 'followup' = only people who asked for follow-up, 'none' = no emails
const TRACKING_COLUMNS = ['Status', 'Contacted?', 'Meeting booked?', 'Est. AUM', 'Notes']; // for you to fill in by hand
const ACTIVITY_TAB = 'Activity'; // one row per visit: how far they got (never their answers)
// ======================

const ACTIVITY_COLUMNS = ['Opened', 'Last activity', 'Checkup', 'Name (from link)', 'Source', 'Furthest step', 'Step #', 'Device', 'Visit ID'];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const data = JSON.parse(e.postData.contents);
    if (data.website) return reply({ ok: true }); // spam trap was filled in, so drop it quietly
    delete data.website;

    if (data.Event === 'visit') {
      // A progress update from someone moving through a checkup, not a finished one. No email.
      logVisit(data);
      return reply({ ok: true });
    }

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

// One row per visit in the Activity tab. Later updates from the same visit change that row,
// and "Furthest step" only ever moves forward (going Back doesn't undo it).
function logVisit(d) {
  const id = String(d['Visit ID'] || '').slice(0, 40);
  if (!id) return;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(ACTIVITY_TAB);
  if (!sheet) {
    sheet = ss.insertSheet(ACTIVITY_TAB);
    sheet.appendRow(ACTIVITY_COLUMNS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, ACTIVITY_COLUMNS.length).setFontWeight('bold');
  }
  const now = new Date();
  const step = Number(d['Step #']) || 0;
  const col = (name) => ACTIVITY_COLUMNS.indexOf(name) + 1;
  const rows = Math.max(sheet.getLastRow() - 1, 1);
  const found = sheet.getRange(2, col('Visit ID'), rows, 1).createTextFinder(id).matchEntireCell(true).findNext();
  if (found) {
    const r = found.getRow();
    sheet.getRange(r, col('Last activity')).setValue(now);
    if (d.Name && !sheet.getRange(r, col('Name (from link)')).getValue()) {
      sheet.getRange(r, col('Name (from link)'), 1, 2).setValues([[safe(d.Name), safe(d.Source)]]);
    }
    if (step > Number(sheet.getRange(r, col('Step #')).getValue())) {
      sheet.getRange(r, col('Furthest step'), 1, 2).setValues([[safe(d.Step), step]]);
    }
    return;
  }
  sheet.appendRow([now, now, safe(d.Assessment), safe(d.Name), safe(d.Source), safe(d.Step), step, safe(d.Device), id]);
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
    const tag = wants ? ' (WANTS FOLLOW-UP)' : row['Wants follow-up'] === 'Maybe' ? ' (MAYBE)' : ' (results only)';
    const subject = 'Checkup: ' + name + (sizing ? ' · ' + sizing : '') + tag;
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
