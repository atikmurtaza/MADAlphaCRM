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

function parseAmount(val: any): number {
  if (!val) return 0;
  const str = String(val).replace(/[^0-9.-]+/g, "");
  return parseFloat(str) || 0;
}

export async function runImport() {
  console.log("Starting CRM Data Import...");
  const auth = await getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth: auth as any });

  // 1. Clear transactional data but keep Users and Teams (from our strict seeding)
  await prisma.refundTransaction.deleteMany();
  await prisma.paymentTransaction.deleteMany();
  await prisma.designerAssignment.deleteMany();
  await prisma.deliverable.deleteMany();
  await prisma.projectAssignment.deleteMany();
  await prisma.project.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.client.deleteMany();
  
  // We already seeded Teams and Users in Phase 1 (Rafi, Umer, Bilal, etc.)
  // Let's get the teams map
  const teams = await prisma.team.findMany();
  const teamMap = new Map(teams.map(t => [t.name.toLowerCase().replace(/\s+/g, ''), t.id]));
  
  // Get all users
  const users = await prisma.user.findMany();
  const userMap = new Map(users.map(u => [u.name.toLowerCase().trim(), u]));
  
  // Fallback client
  const fallbackClient = await prisma.client.create({
    data: { name: 'Legacy Imported Client' }
  });

  // 2. Fetch Team Sales Sheets
  for (const sheetInfo of TEAM_SHEETS) {
    console.log(`\nImporting ${sheetInfo.teamName}...`);
    try {
      const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetInfo.id });
      const titles = meta.data.sheets?.map(s => s.properties?.title) || [];
      if (titles.length === 0) continue;
      const formTab = titles.find(t => t?.includes('Form Responses')) || titles[0];
      const data = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetInfo.id,
        range: `${formTab}!A1:Z5000` // Include header
      });
      
      const rows = data.data.values || [];
      if (rows.length < 2) continue; // Need at least header + 1 row
      
      const headerRow = rows[0].map(h => String(h || '').trim().toLowerCase());
      
      // Dynamic Column Mapping
      const colMap = {
        timestamp: headerRow.findIndex(h => h.includes('timestamp') || h.includes('date')),
        agent: headerRow.findIndex(h => h.includes('agent') || h.includes('name') || h.includes('rep')),
        target: headerRow.findIndex(h => h.includes('target') || h.includes('total') || h.includes('sale amount')),
        advance: headerRow.findIndex(h => h.includes('advance') || h.includes('cleared') || h.includes('paid')),
        status: headerRow.findIndex(h => h.includes('status')),
        client: headerRow.findIndex(h => h.includes('client')),
        product: headerRow.findIndex(h => h.includes('product') || h.includes('service') || h.includes('package')),
        desc: headerRow.findIndex(h => h.includes('desc') || h.includes('detail')),
        method: headerRow.findIndex(h => h.includes('method') || h.includes('platform')),
        social: headerRow.findIndex(h => h.includes('phone') || h.includes('social') || h.includes('handle') || h.includes('contact') || h.includes('number')),
        clearance: headerRow.findIndex((h, idx) => h.includes('clearance') || h.includes('cleared') || h.includes('completion') || (sheetInfo.teamName.includes('Night') && idx === 6))
      };

      console.log(`Found ${rows.length - 1} rows in tab ${formTab}. Column Map:`, colMap);
      
      let imported = 0;
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        
        const timestamp = colMap.timestamp >= 0 ? String(row[colMap.timestamp] || '').trim() : '';
        const agentNameRaw = colMap.agent >= 0 ? String(row[colMap.agent] || '').trim() : '';
        if (!timestamp || !agentNameRaw) continue; // Skip empty
        
        const agentNameLower = agentNameRaw.toLowerCase();
        
        // 1. Strict Timestamp Filter: ONLY keep 2026 data!
        if (!timestamp.includes('2026')) continue;

        // 2. Strict Numeric Validation on Total Amount
        const rawTotalStr = colMap.target >= 0 ? String(row[colMap.target] || '').replace(/[^0-9.-]+/g, "") : "0";
        const total = parseFloat(rawTotalStr);
        if (isNaN(total) || total <= 0) continue; // It's a month divider or junk
        
        const advance = colMap.advance >= 0 ? parseAmount(row[colMap.advance]) : 0;
        let status = colMap.status >= 0 ? String(row[colMap.status] || 'IN_PROGRESS').toUpperCase() : 'IN_PROGRESS';
        
        if (status.includes('COMPLETE')) status = 'COMPLETED';
        else if (status.includes('DECLINE')) status = 'DECLINED';
        else if (status.includes('REFUND')) status = 'REFUNDED';
        else status = 'IN_PROGRESS';
        
        const clientName = colMap.client >= 0 ? (String(row[colMap.client] || '').trim() || 'Unknown Client') : 'Unknown Client';
        const product = colMap.product >= 0 ? String(row[colMap.product] || '').trim() : '';
        const productDescription = colMap.desc >= 0 ? String(row[colMap.desc] || '').trim() : '';
        const paymentMethod = colMap.method >= 0 ? String(row[colMap.method] || '').trim() : '';
        const clientSocialHandle = colMap.social >= 0 ? String(row[colMap.social] || '').trim() : '';
        const clearanceRaw = colMap.clearance >= 0 ? String(row[colMap.clearance] || '').trim() : '';
        const realDate = new Date(timestamp);
        
        let clearedAt: Date | undefined = undefined;
        if (status === 'COMPLETED') {
          if (clearanceRaw) {
            const parsed = new Date(clearanceRaw);
            if (!isNaN(parsed.getTime())) {
              clearedAt = parsed;
            } else {
              const parsedMonth = new Date("1 " + clearanceRaw + " 2026");
              if (!isNaN(parsedMonth.getTime())) {
                clearedAt = parsedMonth;
              }
            }
          }
          if (!clearedAt && !isNaN(realDate.getTime())) {
            clearedAt = realDate;
          }
        }
        
        // Find or create user
        let user = userMap.get(agentNameLower);
        if (!user) {
          // Determine team based on sheet name roughly
          let teamId = teams[0].id; // Fallback to first team
          for (const t of teams) {
            if (sheetInfo.teamName.toLowerCase().includes(t.name.toLowerCase().replace('team ', ''))) {
              teamId = t.id;
              break;
            }
          }
          
          user = await prisma.user.create({
            data: {
              name: agentNameRaw,
              email: `${agentNameRaw.replace(/\s+/g, '.').toLowerCase()}@crm.local`,
              position: 'Employee',
              teamId: teamId
            }
          });
          userMap.set(agentNameLower, user);
          console.log(`Created new employee (Resigned/Historical): ${agentNameRaw}`);
          
          // Also create a default comp profile so they don't crash payroll
          await prisma.compensationProfile.create({
            data: {
              userId: user.id,
              baseSalaryCap: 25000,
              ratePerUnit: 50,
              commissionRate: 40
            }
          })
        }
        
        const teamIdToUse = user.teamId || teams[0].id;
        
        // Create Client
        const client = await prisma.client.create({
          data: { name: clientName }
        });

        // Create Sale
        const sale = await prisma.sale.create({
          data: {
            clientId: client.id,
            agentId: user.id,
            teamId: teamIdToUse,
            targetAmount: total,
            status: status,
            createdAt: isNaN(realDate.getTime()) ? new Date() : realDate,
            clearedAt: clearedAt,
            product,
            productDescription,
            clientSocialHandle,
            customSaleId: 'INV-' + Math.random().toString(36).substring(2, 8).toUpperCase()
          }
        });
        
        // Create Project
        const project = await prisma.project.create({
          data: {
            saleId: sale.id,
            status: status,
            createdAt: isNaN(realDate.getTime()) ? new Date() : realDate
          }
        });
        
        // Create Payment Transaction for advance
        if (advance > 0) {
          await prisma.paymentTransaction.create({
            data: {
              saleId: sale.id,
              amount: advance,
              method: paymentMethod,
              recordedAt: isNaN(realDate.getTime()) ? new Date() : realDate
            }
          });
        }
        imported++;
      }
      console.log(`Successfully imported ${imported} sales for ${sheetInfo.teamName}`);
    } catch (e: any) {
      console.error(`Error importing ${sheetInfo.teamName}:`, e.message);
    }
  }
  
  console.log("\nImport Complete!");
}

runImport().catch(console.error);
