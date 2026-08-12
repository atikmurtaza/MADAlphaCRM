import { google } from 'googleapis';
import { getAuthClient } from './google-sheets';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TEAM_SHEETS = [
  { teamName: 'Team Rafi', id: '1cbrDOh3_1PVLvsyCUR36MsSqJwepYMwfDTke0AlxJiA' },
  { teamName: 'Team Umer (Night)', id: '1UqtdJE2ohPP3ocgkV_6szhVySkk7fMq0WU7UJKYogks' },
  { teamName: 'Team Umer (Evening - Boys)', id: '13kKzwTZ2AiO6FWW-Jvnv229B-9fzbwFCP-Qs-HRfkhs' },
  { teamName: 'Team Umer (Evening - Girls)', id: '1nEYv0DUc0q6morfFvw74aRnDTW45fHKtyAGdv32n1Uo' },
  { teamName: 'Team Bilal', id: '1Zx_OWqaNKkXe0VBtOf0szxmClVpnNMOBNVD5hiaYIb0' },
  { teamName: 'Team Mudassir', id: '1q_I_-M162QOH3Lugjt7wZZR7YY5AmoKG5JlwoQdDfSY' },
  { teamName: 'Team Hamza', id: '1mM4b7r0vFajxxOdttnmpMTYDCmaCg851Xb2EM72e5mg' }
];

async function fixClients() {
  const auth = await getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth: auth as any });

  for (const sheetInfo of TEAM_SHEETS) {
    console.log(`Fixing clients for ${sheetInfo.teamName}...`);
    try {
      const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetInfo.id });
      const titles = meta.data.sheets?.map(s => s.properties?.title) || [];
      const formTab = titles.find(t => t?.includes('Form Responses')) || titles[0];
      
      const data = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetInfo.id,
        range: `${formTab}!A1:Z5000`
      });
      
      const rows = data.data.values || [];
      if (rows.length < 2) continue;
      
      const headerRow = rows[0].map(h => String(h || '').trim().toLowerCase());
      
      // Better mappings
      const emailCol = headerRow.findIndex(h => h.includes('email'));
      const phoneCol = headerRow.findIndex(h => h.includes('phone') || h.includes('number'));
      const socialCol = headerRow.findIndex(h => h.includes('social') || h.includes('handle') || h.includes('discord') || h.includes('instagram'));
      const clientCol = headerRow.findIndex(h => h.includes('client'));
      
      console.log(`Email Col: ${emailCol}, Phone Col: ${phoneCol}, Social Col: ${socialCol}, Client Col: ${clientCol}`);
      
      let updated = 0;
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row[0] || !row[0].includes('2026')) continue;
        
        const clientName = clientCol >= 0 ? String(row[clientCol] || '').trim() : '';
        if (!clientName) continue;
        
        const email = emailCol >= 0 ? String(row[emailCol] || '').trim() : null;
        const phone = phoneCol >= 0 ? String(row[phoneCol] || '').trim() : null;
        const social = socialCol >= 0 ? String(row[socialCol] || '').trim() : null;
        
        // Find sales with this clientName and team
        const sales = await prisma.sale.findMany({
          where: {
            client: {
              name: clientName
            }
          },
          include: { client: true }
        });
        
        for (const sale of sales) {
          // Update client with email and phone
          if (sale.client && (!sale.client.email || !sale.client.phone)) {
            await prisma.client.update({
              where: { id: sale.clientId },
              data: {
                email: email || undefined,
                phone: phone || undefined
              }
            });
          }
          
          // Update sale with proper social handle if it was mismapped
          if (social && sale.clientSocialHandle !== social) {
             await prisma.sale.update({
               where: { id: sale.id },
               data: { clientSocialHandle: social }
             });
          } else if (!social && phone && sale.clientSocialHandle === phone) {
             // If phone was accidentally saved as social handle, clear it
             await prisma.sale.update({
               where: { id: sale.id },
               data: { clientSocialHandle: null }
             });
          }
          
          updated++;
        }
      }
      console.log(`Updated ${updated} records for ${sheetInfo.teamName}`);
    } catch(e) {
      console.error(e);
    }
  }
}

fixClients().catch(console.error).finally(() => prisma.$disconnect());
