import { google } from 'googleapis';
import { getAuthClient } from './google-sheets';

const TEAM_SHEETS = [
  { teamName: 'Team Rafi', id: '1cbrDOh3_1PVLvsyCUR36MsSqJwepYMwfDTke0AlxJiA' },
  { teamName: 'Team Umer (Night)', id: '1UqtdJE2ohPP3ocgkV_6szhVySkk7fMq0WU7UJKYogks' },
  { teamName: 'Team Umer (Evening - Boys)', id: '13kKzwTZ2AiO6FWW-Jvnv229B-9fzbwFCP-Qs-HRfkhs' },
  { teamName: 'Team Umer (Evening - Girls)', id: '1nEYv0DUc0q6morfFvw74aRnDTW45fHKtyAGdv32n1Uo' },
  { teamName: 'Team Bilal', id: '1Zx_OWqaNKkXe0VBtOf0szxmClVpnNMOBNVD5hiaYIb0' },
  { teamName: 'Team Mudassir', id: '1q_I_-M162QOH3Lugjt7wZZR7YY5AmoKG5JlwoQdDfSY' },
  { teamName: 'Team Hamza', id: '1mM4b7r0vFajxxOdttnmpMTYDCmaCg851Xb2EM72e5mg' }
];

async function logHeaders() {
  const auth = await getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth: auth as any });
  
  for (const sheetInfo of TEAM_SHEETS) {
    const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetInfo.id });
    const titles = meta.data.sheets?.map(s => s.properties?.title) || [];
    const formTab = titles.find(t => t?.includes('Form Responses')) || titles[0];
    const data = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetInfo.id,
      range: `${formTab}!A1:Z1`
    });
    console.log(sheetInfo.teamName + ':');
    console.log(data.data.values?.[0]);
  }
}
logHeaders().catch(console.error);
