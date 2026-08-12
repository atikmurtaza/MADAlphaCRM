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

  const sheetNames = ['Rafi', 'Bilal', 'Hamza', 'Umer', 'Umer (EV-B)', 'Umer (EV-G)', 'Mudassir', 'TLs'];

  for (const sheetName of sheetNames) {
    try {
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `'${sheetName}'!A4:J7`,
        valueRenderOption: 'FORMULA',
      });
      console.log(`\n--- ${sheetName} ---`);
      if (res.data.values) {
        res.data.values.forEach(row => console.log(row));
      }
    } catch (e) {
      console.error(`Error reading ${sheetName}: ${e.message}`);
    }
  }
}

main().catch(console.error);
