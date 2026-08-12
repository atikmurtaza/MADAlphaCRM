import { google } from 'googleapis';
import { getAuthClient } from './google-sheets';

async function checkCols() {
  const auth = await getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth: auth as any });
  const data = await sheets.spreadsheets.values.get({
    spreadsheetId: '1cbrDOh3_1PVLvsyCUR36MsSqJwepYMwfDTke0AlxJiA',
    range: `Form Responses 1!A1:Z2` 
  });
  console.log(data.data.values);
}

checkCols().catch(console.error);
