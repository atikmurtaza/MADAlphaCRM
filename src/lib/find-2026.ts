import { google } from 'googleapis';
import { getAuthClient } from './google-sheets';

async function find2026() {
  const auth = await getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth: auth as any });
  
  const meta = await sheets.spreadsheets.get({ spreadsheetId: '1UqtdJE2ohPP3ocgkV_6szhVySkk7fMq0WU7UJKYogks' });
  const titles = meta.data.sheets?.map(s => s.properties?.title) || [];
  
  for (const title of titles) {
    try {
      const data = await sheets.spreadsheets.values.get({
        spreadsheetId: '1UqtdJE2ohPP3ocgkV_6szhVySkk7fMq0WU7UJKYogks',
        range: `${title}!A1:Z5000`
      });
      const rows = data.data.values || [];
      const yr2026 = rows.filter(r => String(r[0]).includes('2026'));
      console.log(`Tab ${title} has ${yr2026.length} rows with 2026 in column A.`);
      if (yr2026.length > 0) {
        console.log("Sample:", yr2026[0]);
      }
    } catch (e: any) {
      console.log(`Error reading ${title}: ${e.message}`);
    }
  }
}

find2026().catch(console.error);
