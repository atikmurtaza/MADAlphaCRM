import { google } from 'googleapis';
import { getAuthClient } from './google-sheets';

async function logSheet() {
  const auth = await getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth: auth as any });
  
  const meta = await sheets.spreadsheets.get({ spreadsheetId: '1cbrDOh3_1PVLvsyCUR36MsSqJwepYMwfDTke0AlxJiA' });
  const title = meta.data.sheets?.[0].properties?.title;
  
  const data = await sheets.spreadsheets.values.get({
    spreadsheetId: '1cbrDOh3_1PVLvsyCUR36MsSqJwepYMwfDTke0AlxJiA',
    range: `${title}!A80:E100`
  });
  console.log(data.data.values);
}
logSheet().catch(console.error);
