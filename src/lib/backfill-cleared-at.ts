import { google } from 'googleapis';
import { PrismaClient } from '@prisma/client';

const TEAM_SHEETS = [
  { teamName: 'Team Rafi', id: '1cbrDOh3_1PVLvsyCUR36MsSqJwepYMwfDTke0AlxJiA' },
  { teamName: 'Team Umer (Night)', id: '1UqtdJE2ohPP3ocgkV_6szhVySkk7fMq0WU7UJKYogks' },
  { teamName: 'Team Umer (Evening - Boys)', id: '13kKzwTZ2AiO6FWW-Jvnv229B-9fzbwFCP-Qs-HRfkhs' },
  { teamName: 'Team Umer (Evening - Girls)', id: '1nEYv0DUc0q6morfFvw74aRnDTW45fHKtyAGdv32n1Uo' },
  { teamName: 'Team Bilal', id: '1Zx_OWqaNKkXe0VBtOf0szxmClVpnNMOBNVD5hiaYIb0' },
  { teamName: 'Team Mudassir', id: '1q_I_-M162QOH3Lugjt7wZZR7YY5AmoKG5JlwoQdDfSY' },
  { teamName: 'Team Hamza', id: '1mM4b7r0vFajxxOdttnmpMTYDCmaCg851Xb2EM72e5mg' }
];

const prisma = new PrismaClient();

async function backfillClearedAt() {
  const auth = new google.auth.GoogleAuth({
    keyFile: 'src/lib/google-credentials.json',
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  for (const sheetInfo of TEAM_SHEETS) {
    console.log(`\nBackfilling ${sheetInfo.teamName}...`);
    try {
      const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetInfo.id });
      const titles = meta.data.sheets?.map(s => s.properties?.title) || [];
      if (titles.length === 0) continue;
      const formTab = titles.find(t => t?.includes('Form Responses')) || titles[0];
      const data = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetInfo.id,
        range: `${formTab}!A1:Z5000`
      });
      
      const rows = data.data.values || [];
      if (rows.length < 2) continue;
      
      const headerRow = rows[0].map(h => String(h || '').trim().toLowerCase());
      
      const colMap = {
        agent: headerRow.findIndex(h => h.includes('agent') || h.includes('name') || h.includes('rep')),
        client: headerRow.findIndex(h => h.includes('client')),
        status: headerRow.findIndex(h => h.includes('status')),
        clearance: headerRow.findIndex((h, idx) => h.includes('clearance') || h.includes('cleared') || h.includes('completion') || (sheetInfo.teamName.includes('Night') && idx === 6))
      };

      console.log(`Column Map:`, colMap);
      
      let updated = 0;
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        
        const agentNameRaw = colMap.agent >= 0 ? String(row[colMap.agent] || '').trim() : '';
        const clientName = colMap.client >= 0 ? String(row[colMap.client] || '').trim() : '';
        let status = colMap.status >= 0 ? String(row[colMap.status] || 'IN_PROGRESS').toUpperCase() : 'IN_PROGRESS';
        
        if (status.includes('COMPLETE')) status = 'COMPLETED';
        else if (status.includes('DECLINE')) status = 'DECLINED';
        else if (status.includes('REFUND')) status = 'REFUNDED';
        else status = 'IN_PROGRESS';
        
        const clearanceRaw = colMap.clearance >= 0 ? String(row[colMap.clearance] || '').trim() : '';
        
        if ((status === 'COMPLETED' || status === 'REFUNDED') && clearanceRaw && clientName) {
           let clearedAt: Date | undefined;
           const parsed = new Date(clearanceRaw);
           if (!isNaN(parsed.getTime())) {
             clearedAt = parsed;
           } else {
             const parsedMonth = new Date("1 " + clearanceRaw + " 2026");
             if (!isNaN(parsedMonth.getTime())) {
               clearedAt = parsedMonth;
             }
           }
           
           if (clearedAt) {
             const sales = await prisma.sale.findMany({
               where: {
                 status: status,
                 client: { name: { contains: clientName } }
               }
             });
             
             if (sales.length > 0) {
               await prisma.sale.update({
                 where: { id: sales[0].id },
                 data: { clearedAt }
               });
               updated++;
             }
           }
        }
      }
      console.log(`Updated ${updated} sales clearedAt dates in ${sheetInfo.teamName}`);
    } catch (e: any) {
      console.error(`Error updating ${sheetInfo.teamName}:`, e.message);
    }
  }
}

backfillClearedAt().catch(console.error).finally(() => prisma.$disconnect());
