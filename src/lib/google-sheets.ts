import { google } from 'googleapis';
import path from 'path';

// Define the scopes we need
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

export async function getAuthClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
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
