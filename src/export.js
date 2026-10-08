'use strict';

function csvEscape(value) {
  const s = value === null || value === undefined ? '' : String(value);
  if (/[",\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

// rows: array of flat objects. Columns taken from the union of keys of the first row.
function toCSV(rows) {
  if (!rows || rows.length === 0) return '';
  const columns = Object.keys(rows[0]);
  const header = columns.map(csvEscape).join(',');
  const lines = rows.map((row) => columns.map((col) => csvEscape(row[col])).join(','));
  return [header, ...lines].join('\n') + '\n';
}

function sendCSV(res, filename, rows) {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(toCSV(rows));
}

function sendJSON(res, filename, rows) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.json(rows);
}

module.exports = { toCSV, sendCSV, sendJSON };
