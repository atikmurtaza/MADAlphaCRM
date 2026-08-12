import { google } from 'googleapis';
import { getAuthClient } from './google-sheets';

export async function checkSheets() {
  const auth = await getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth: auth as any });
  
  const ids = [
    '1W5PPd2YaxvSPQpkknn5qBq1UF_VnnJKqSjofHfi-qcs', // Trial2
    '1KUjYS5Mn8x2IF1ZQ7n_5RM2jQ5cABx4x0Jthdg-k02g'  // Salary Calculation
  ];
  
  for (const id of ids) {
    console.log('\n--- Fetching metadata for:', id, '---');
    try {
      const meta = await sheets.spreadsheets.get({ spreadsheetId: id });
      const titles = meta.data.sheets?.map(s => s.properties?.title) || [];
      console.log('Tabs:', titles);
      
      // Fetch first 5 rows of first tab
      if (titles.length > 0) {
        const data = await sheets.spreadsheets.values.get({
          spreadsheetId: id,
          range: `${titles[0]}!A1:Z5`
        });
        console.log('Sample Data of first tab:');
        console.table(data.data.values);
      }
    } catch (e: any) {
      console.error('Error fetching', id, e.message);
    }
  }
}
checkSheets().catch(console.error);
