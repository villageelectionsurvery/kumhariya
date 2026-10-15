/**
 * Kumhariya survey backend: a Google Apps Script web app bound to a Google Sheet.
 * Setup steps are in the project README. Keep CONFIG in step with
 * src/lib/config.ts in the website.
 *
 * Endpoints (the web app URL):
 *   GET  ?action=results            → survey totals for the results page
 *   GET  ?action=status&device=ID   → whether this device has already answered
 *   POST {"action":"submit", ...}   → saves one response (sent as text/plain)
 */

var CONFIG = {
  surveyTitle: 'ग्राम कुम्हारिया चुनाव सर्वेक्षण',
  sheetName: 'Responses',
  posts: [
    { id: 'sarpanch', label: 'सरपंच' },
    { id: 'upsarpanch', label: 'उपसरपंच' },
    { id: 'ward_1', label: 'वार्ड पंच - वार्ड 1' },
    { id: 'ward_2', label: 'वार्ड पंच - वार्ड 2' },
    { id: 'ward_3', label: 'वार्ड पंच - वार्ड 3' }
  ],
  parties: [
    { id: 'congress', label: 'कांग्रेस' },
    { id: 'bjp', label: 'बीजेपी' },
    { id: 'independent', label: 'निर्दलीय', independent: true }
  ]
};

var FIXED_COLUMNS = ['response_id', 'submitted_at', 'device_hash', 'submission_id', 'selections_json'];
var NAME_PATTERN = /^[\p{L}\p{M}\s.'-]{2,60}$/u;

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || '';
  try {
    if (action === 'results') return json_(results_());
    if (action === 'status') {
      var device = String(e.parameter.device || '');
      if (!/^[a-f0-9]{32}$/.test(device)) return json_({ ok: false, message: 'invalid device' });
      return json_({ ok: true, submitted: deviceHasSubmitted_(rows_(), deviceHash_(device)) });
    }
    return json_({ ok: false, message: 'unknown action' });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, message: 'सर्वर त्रुटि। कृपया बाद में प्रयास करें।' });
  }
}

function doPost(e) {
  var body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return json_({ ok: false, message: 'अमान्य अनुरोध।' });
  }
  if (body.action !== 'submit') return json_({ ok: false, message: 'अमान्य अनुरोध।' });

  var device = String(body.device_id || '');
  var submissionId = String(body.submission_id || '');
  if (!/^[a-f0-9]{32}$/.test(device) || !/^[a-f0-9]{32}$/.test(submissionId)) {
    return json_({ ok: false, message: 'कृपया पेज रीफ़्रेश करके दोबारा प्रयास करें।' });
  }

  var checked = validate_(body.selections || {});
  if (Object.keys(checked.errors).length) {
    return json_({ ok: false, errors: checked.errors, message: 'कृपया सभी प्रश्नों के उत्तर सही से भरें।' });
  }

  // One writer at a time: the duplicate checks and the append happen together.
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) {
    return json_({ ok: false, message: 'अभी बहुत अधिक प्रतिक्रियाएँ आ रही हैं। कृपया थोड़ी देर बाद प्रयास करें।' });
  }
  try {
    var sheet = sheet_();
    var rows = rows_(sheet);
    var hash = deviceHash_(device);
    for (var i = 0; i < rows.length; i++) {
      // Same form sent twice (retry or double click): already saved.
      if (rows[i].submission_id === submissionId) return json_({ ok: true });
    }
    if (deviceHasSubmitted_(rows, hash)) {
      return json_({ ok: false, code: 'device_used', message: 'इस डिवाइस से सर्वेक्षण पहले ही जमा किया जा चुका है।' });
    }

    var row = [
      Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyyMMdd') + '-' + Utilities.getUuid().replace(/-/g, '').slice(0, 16),
      Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ssXXX"),
      hash,
      submissionId,
      JSON.stringify(checked.selections)
    ];
    CONFIG.posts.forEach(function (post) {
      var sel = checked.selections[post.label];
      row.push(sel.party, sel.candidate_name || '');
    });
    sheet.appendRow(row);
    return json_({ ok: true });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, message: 'तकनीकी कारण से प्रतिक्रिया सहेजी नहीं जा सकी। कृपया थोड़ी देर बाद प्रयास करें।' });
  } finally {
    lock.releaseLock();
  }
}

/** Checks every configured post; returns selections keyed by post label. */
function validate_(input) {
  var selections = {};
  var errors = {};
  CONFIG.posts.forEach(function (post) {
    var answer = input[post.id] || {};
    var party = CONFIG.parties.filter(function (p) { return p.id === answer.party; })[0];
    if (!party) {
      errors[post.id] = post.label + ' पद के लिए अपनी पसंद चुनें।';
      return;
    }
    var candidate = null;
    if (party.independent) {
      candidate = cleanName_(String(answer.candidate || ''));
      if (!NAME_PATTERN.test(candidate)) {
        errors[post.id] = post.label + ' पद के निर्दलीय उम्मीदवार का सही नाम लिखें (2–60 अक्षर)।';
        return;
      }
    }
    selections[post.label] = { party: party.label, candidate_name: candidate };
  });
  return { selections: selections, errors: errors };
}

/** Counts per post. Percentages are worked out by the website. */
function results_() {
  var rows = rows_();
  var independent = CONFIG.parties.filter(function (p) { return p.independent; })[0];
  var posts = CONFIG.posts.map(function (post) {
    var parties = {};
    CONFIG.parties.forEach(function (p) { parties[p.label] = 0; });
    var candidates = {};
    var total = 0;
    rows.forEach(function (r) {
      var sel = r.selections[post.label];
      if (!sel || !(sel.party in parties)) return;
      total++;
      parties[sel.party]++;
      if (independent && sel.party === independent.label && sel.candidate_name) {
        var name = cleanName_(sel.candidate_name);
        var key = name.toLowerCase();
        candidates[key] = candidates[key] || { name: name, count: 0 };
        candidates[key].count++;
      }
    });
    return {
      id: post.id,
      label: post.label,
      total: total,
      parties: parties,
      candidates: Object.keys(candidates).map(function (k) { return candidates[k]; })
    };
  });
  return { ok: true, survey: CONFIG.surveyTitle, total_responses: rows.length, posts: posts, updated_at: new Date().toISOString() };
}

function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.sheetName) || ss.insertSheet(CONFIG.sheetName);
  if (sheet.getLastRow() === 0) {
    var header = FIXED_COLUMNS.slice();
    CONFIG.posts.forEach(function (post) { header.push(post.label + ' — पार्टी', post.label + ' — निर्दलीय नाम'); });
    sheet.appendRow(header);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/** All saved responses; selections come from the JSON column, which stays valid
    even if posts are added later. Rows with unreadable JSON are skipped. */
function rows_(sheet) {
  sheet = sheet || sheet_();
  var last = sheet.getLastRow();
  if (last < 2) return [];
  var values = sheet.getRange(2, 1, last - 1, FIXED_COLUMNS.length).getValues();
  var out = [];
  values.forEach(function (v) {
    try {
      out.push({ device_hash: String(v[2]), submission_id: String(v[3]), selections: JSON.parse(v[4]) });
    } catch (err) {
      console.warn('Skipping row with invalid selections_json');
    }
  });
  return out;
}

function deviceHasSubmitted_(rows, hash) {
  return rows.some(function (r) { return r.device_hash === hash; });
}

/** The raw device ID is never stored, only an HMAC keyed with a secret that
    is created once and kept in Script Properties. */
function deviceHash_(device) {
  var props = PropertiesService.getScriptProperties();
  var key = props.getProperty('DEVICE_SALT');
  if (!key) {
    key = Utilities.getUuid() + Utilities.getUuid();
    props.setProperty('DEVICE_SALT', key);
  }
  return Utilities.computeHmacSha256Signature(device, key)
    .map(function (b) { return ('0' + (b & 0xff).toString(16)).slice(-2); })
    .join('');
}

function cleanName_(s) {
  return s.replace(/\s+/g, ' ').trim().normalize('NFC');
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
