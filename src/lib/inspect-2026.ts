import { google } from 'googleapis';
import { getAuthClient } from './google-sheets';

async function inspect() {
  const auth = await getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth: auth as any });
  
  const meta = await sheets.spreadsheets.get({ spreadsheetId: '14xVzXvB0yGZJ6m4J7o63kR9H5wZ5v2Z-eY2uF2V7V3o' });
  const title = meta.data.sheets?.[0].properties?.title;
  
  const data = await sheets.spreadsheets.values.get({
    spreadsheetId: '14xVzXvB0yGZJ6m4J7o63kR9H5wZ5v2Z-eY2uF2V7V3o',
    range: `${title}!A1:E2000` // Read everything
  });
  
  const values = data.data.values || [];
  const yr2026 = values.filter(row => String(row[0]).includes('2026'));
  console.log(`Found ${yr2026.length} rows with '2026' in Trial2.`);
  console.log(yr2026.slice(0, 10)); // sample
  
  // also print latest 5 rows just to see what year they are
  console.log("Latest 5 rows:");
  console.log(values.slice(-5));
}

inspect().catch(console.error);
