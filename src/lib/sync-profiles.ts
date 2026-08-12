import { google } from 'googleapis';
import { getAuthClient } from './google-sheets';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function parseAmount(val: any): number {
  if (!val) return 0;
  const str = String(val).replace(/[^0-9.-]+/g, "");
  return parseFloat(str) || 0;
}

async function syncProfiles() {
  const auth = await getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth: auth as any });
  const spreadsheetId = '1KUjYS5Mn8x2IF1ZQ7n_5RM2jQ5cABx4x0Jthdg-k02g';

  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const titles = meta.data.sheets?.map(s => s.properties?.title) || [];
  
  const users = await prisma.user.findMany();
  const userMap = new Map(users.map(u => [u.name.toLowerCase().trim(), u]));
  
  let updated = 0;

  for (const title of titles) {
    if (!title) continue;
    if (title.toLowerCase().includes('trial') || title.toLowerCase().includes('summary')) continue;
    
    const data = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${title}!A6:AF100` // Starting below headers
    });
    
    const rows = data.data.values || [];
    for (const row of rows) {
      const name = String(row[0] || '').trim();
      if (!name || name === 'NAMES' || name === 'Total') continue;
      
      const user = userMap.get(name.toLowerCase());
      if (user) {
        // Let's find the max salary they achieved across the 3 months (Jan, Feb, March)
        // Month 1: Target=Col 3, Salary=Col 5
        // Month 2: Target=Col 12, Salary=Col 14
        // Month 3: Target=Col 21, Salary=Col 23
        
        const caps = [
          { t: parseAmount(row[3]), s: parseAmount(row[5]) },
          { t: parseAmount(row[12]), s: parseAmount(row[14]) },
          { t: parseAmount(row[21]), s: parseAmount(row[23]) }
        ];
        
        let maxSalary = 25000;
        let inferredRate = 50;
        
        for (const c of caps) {
          if (c.s > maxSalary) maxSalary = c.s;
          if (c.t > 0 && c.s > 0) {
            const rate = c.s / c.t;
            if (rate >= 40 && rate <= 60) {
               inferredRate = Math.round(rate);
            }
          }
        }
        
        // Ensure cap is a clean number (e.g. 25000, 30000, 50000)
        let finalCap = 25000;
        if (maxSalary > 25000 && maxSalary <= 30000) finalCap = 30000;
        if (maxSalary > 30000 && maxSalary <= 50000) finalCap = 50000;
        if (maxSalary > 50000) finalCap = Math.ceil(maxSalary / 10000) * 10000;

        // Update the profile
        const profile = await prisma.compensationProfile.findFirst({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' }
        });
        
        if (profile) {
          if (profile.baseSalaryCap !== finalCap || profile.ratePerUnit !== inferredRate) {
             await prisma.compensationProfile.update({
               where: { id: profile.id },
               data: {
                 baseSalaryCap: finalCap,
                 ratePerUnit: inferredRate
               }
             });
             console.log(`Updated ${user.name}: Cap=${finalCap}, Rate=${inferredRate}`);
             updated++;
          }
        }
      }
    }
  }
  console.log(`Successfully synced ${updated} profiles based on Google Sheets.`);
}

syncProfiles().catch(console.error).finally(() => prisma.$disconnect());
