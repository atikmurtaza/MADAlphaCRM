import { google } from 'googleapis';
import path from 'path';

// Define the scopes we need
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

export async function getAuthClient() {
  const credentialsPath = path.join(process.cwd(), 'src/lib/google-credentials.json');
  
  const auth = new google.auth.GoogleAuth({
    keyFile: credentialsPath,
    scopes: SCOPES,
  });

  return await auth.getClient();
}

export async function getSpreadsheetData(spreadsheetId: string, range: string) {
  try {
    const auth = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth: auth as any });
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });
    
    return response.data.values;
  } catch (error) {
    console.error('Error fetching spreadsheet data:', error);
    throw error;
  }
}
