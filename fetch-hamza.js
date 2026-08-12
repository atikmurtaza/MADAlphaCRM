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
    range: `'Hamza'!A7:K50`,
    valueRenderOption: 'FORMULA',
  });

  const rows = res.data.values;
  if (!rows) return;

  for (let i = 0; i < rows.length; i++) {
    const name = rows[i][0];
    const sal = rows[i][4];
    if (sal && sal.toString().match(/\b5000\b/)) {
      console.log(`Found exact 5k for ${name}:`);
      console.log(`Salary: ${sal}`);
      console.log(`Bonus: ${rows[i][5]}`);
      console.log(`Comm: ${rows[i][7]}`);
      console.log(`ToBePaid: ${rows[i][9]}`);
    }
  }
}

main().catch(console.error);
