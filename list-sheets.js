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

  try {
    const res = await sheets.spreadsheets.get({ spreadsheetId });
    const sheetTitles = res.data.sheets.map(s => s.properties.title);
    console.log(sheetTitles.join('\n'));
  } catch (e) {
    console.error(e.message);
  }
}

main().catch(console.error);
