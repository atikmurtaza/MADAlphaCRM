import { google } from 'googleapis';
import { getAuthClient } from './google-sheets';

async function listTabs() {
  const auth = await getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth: auth as any });
  
  const meta = await sheets.spreadsheets.get({ spreadsheetId: '1cbrDOh3_1PVLvsyCUR36MsSqJwepYMwfDTke0AlxJiA' });
  const titles = meta.data.sheets?.map(s => s.properties?.title) || [];
  console.log("Team Rafi Tabs:", titles);
  
  const meta2 = await sheets.spreadsheets.get({ spreadsheetId: '1UqtdJE2ohPP3ocgkV_6szhVySkk7fMq0WU7UJKYogks' });
  console.log("Team Umer Night Tabs:", meta2.data.sheets?.map(s => s.properties?.title));
}

listTabs().catch(console.error);
