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

  const metadata = await sheets.spreadsheets.get({ spreadsheetId });
  const uniqueFormulas = new Set();
  const tiers = {};

  for (const sheet of metadata.data.sheets) {
    const sheetName = sheet.properties.title;
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${sheetName}'!A7:K100`, // Name, Payable, JanTarget, JanCleared, JanSal, JanBonus, JanAll, JanComm, JanPaid, JanToBePaid
      valueRenderOption: 'FORMULA',
    });

    const rows = res.data.values;
    if (!rows) continue;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const name = row[0];
      if (!name || name === 'Total' || name === 'NAMES' || name.startsWith('=')) continue;

      const sal = row[4];
      const bonus = row[5];
      const comm = row[7];
      const toBePaid = row[9];
      
      if (!sal) continue;

      // Normalize formulas to remove row-specific numbers (e.g. C10 -> C, D10 -> D)
      const normalize = (f) => f ? f.toString().toUpperCase().replace(/[A-Z]+[0-9]+/g, 'X') : '';
      const key = `${normalize(sal)} | ${normalize(bonus)} | ${normalize(toBePaid)}`;

      if (!tiers[key]) {
        tiers[key] = {
          examples: [],
          raw: {
            salary: sal,
            bonus: bonus,
            commission: comm,
            toBePaid: toBePaid
          }
        };
      }
      if (tiers[key].examples.length < 3) {
        tiers[key].examples.push(name);
      }
    }
  }

  let i = 1;
  for (const [key, data] of Object.entries(tiers)) {
    console.log(`\n--- TIER ${i++} ---`);
    console.log(`Examples: ${data.examples.join(', ')}`);
    console.log(`Salary Formula: ${data.raw.salary}`);
    console.log(`Bonus Formula: ${data.raw.bonus}`);
    console.log(`Commission Formula: ${data.raw.commission}`);
    console.log(`To Be Paid Formula: ${data.raw.toBePaid}`);
  }
}

main().catch(console.error);
