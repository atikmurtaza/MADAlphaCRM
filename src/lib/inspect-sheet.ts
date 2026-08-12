import { google } from 'googleapis';
import { getAuthClient } from './google-sheets';

async function inspectSalarySheet() {
  const auth = await getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth: auth as any });
  const spreadsheetId = '1KUjYS5Mn8x2IF1ZQ7n_5RM2jQ5cABx4x0Jthdg-k02g';

  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const titles = meta.data.sheets?.map(s => s.properties?.title) || [];
  console.log("Tabs:", titles);

  // Let's read the first tab
  if (titles.length > 0) {
    const data = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${titles[0]}!A1:Z20`
    });
    console.log(`\nData from ${titles[0]}:`);
    console.table(data.data.values);
  }
}

inspectSalarySheet().catch(console.error);
