const { google } = require('googleapis');
const path = require('path');

const keyFilePath = path.join('C:', 'Users', 'atikm', '.gemini', 'antigravity', 'scratch', 'CRM', 'crm-v1-502512-626cca3d0548.json');

async function main() {
  const auth = new google.auth.GoogleAuth({
    keyFile: keyFilePath,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = '1KUjYS5Mn8x2IF1ZQ7n_5RM2jQ5cABx4x0Jthdg-k02g';

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'Hamza'!AV16:BD16`,
    valueRenderOption: 'FORMULA',
  });

  const rows = res.data.values;
  if (!rows) return;

  console.log('Row 16 in AV:BD');
  console.log(rows[0]);
}

main().catch(console.error);
