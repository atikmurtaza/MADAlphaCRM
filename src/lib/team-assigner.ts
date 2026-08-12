import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const EXACT_MAPPINGS = [
  { team: 'Team Rafi', employees: ['Ibrahim Khan', 'Zaryab Ali', 'Mohib Akbar Ali'] },
  { team: 'Team Umer Night', employees: ['Hussain', 'Musadiq Hussain', 'Muhammad Daniyal', 'Maaz Anwar', 'Shayan Hussain', 'Yaseen Abdul Samad'] },
  { team: 'Team Umer (Evening - Boys)', employees: ['Ahmedullah', 'Ayan Zaidi', 'Ghulam Mustafa', 'Hafiz Muhammad Bilal', 'Azan', 'Umar', 'Ayan', 'Aariz', 'Farzan', 'Hammad Ullah Khan', 'Shoaib Gujjar', 'Qaiser Gul'] },
  { team: 'Team Umer (Evening - Girls)', employees: ['Maheen', 'Areeba', 'Shanzay Arshad', 'Alishba', 'Fatima', 'Mahnoor', 'Wania Zahid', 'Yasmeen Mehmood', 'Esha Hussain'] },
  { team: 'Team Bilal', employees: ['Jawwad Khan', 'Muhammad Faizan', 'Muhammad Zaidi', 'Sajjad Khan', 'Abdul Hadi'] },
  { team: 'Team Hamza', employees: ['Ansa Bashir', 'Serena Zafar', 'Araj Khan', 'Urwa', 'Artooba', 'Maira Mehmood', 'Ali Hasan', 'Bilal Khan', 'Ahsan', 'Ehtisham', 'Rafay Khan', 'Ali Shahbaz'] },
  { team: 'Team Mudassir', employees: ['Syed Asif Ali', 'Arham Sheikh', 'Syeda Zauveen', 'Muhammad Sabih', 'Syeda Aliza', 'Muhammad Ahsan', 'Muhammad Safih', 'Mujtaba Haider', 'Sarim Mustafa', 'Shaheer Sheikh', 'Umer Faisal', 'Muhammad Fahad', 'Muhammad Jawwad'] }
];

async function run() {
  console.log("Starting Team Assignment & Cleanup...");
  
  // 1. Ensure all these Teams exist
  for (const m of EXACT_MAPPINGS) {
    let team = await prisma.team.findFirst({ where: { name: m.team } });
    if (!team) {
      team = await prisma.team.create({ data: { name: m.team } });
      console.log(`Created Team: ${m.team}`);
    }
    
    // 2. Ensure employees exist and assign them to the correct team
    for (const emp of m.employees) {
      // Find case-insensitive
      const users = await prisma.user.findMany();
      let user = users.find(u => u.name.toLowerCase() === emp.toLowerCase());
      
      if (!user) {
        user = await prisma.user.create({
          data: {
            name: emp,
            email: `${emp.replace(/\s+/g, '.').toLowerCase()}@crm.local`,
            position: 'Employee',
            teamId: team.id
          }
        });
        
        await prisma.compensationProfile.create({
          data: {
            userId: user.id,
            baseSalaryCap: 25000,
            ratePerUnit: 50,
            commissionRate: 40
          }
        });
        console.log(`Created missing mapped employee: ${emp}`);
      } else {
        await prisma.user.update({
          where: { id: user.id },
          data: { teamId: team.id }
        });
      }
    }
  }

  // 3. Delete junk users (No sales AND not in the mapping list)
  const allUsers = await prisma.user.findMany({
    include: { salesMade: true }
  });
  
  const validNames = new Set(EXACT_MAPPINGS.flatMap(m => m.employees).map(e => e.toLowerCase()));
  
  let deletedCount = 0;
  for (const u of allUsers) {
    if (u.salesMade.length === 0 && !validNames.has(u.name.toLowerCase())) {
      try {
        await prisma.compensationProfile.deleteMany({ where: { userId: u.id } });
        await prisma.monthlyPayrollSnapshot.deleteMany({ where: { userId: u.id } });
        await prisma.commissionLedgerEntry.deleteMany({ where: { earnerId: u.id } });
        await prisma.user.delete({ where: { id: u.id } });
        console.log(`Deleted junk user: ${u.name}`);
        deletedCount++;
      } catch (e) {
        console.log(`Could not delete user ${u.name} due to foreign keys. Preserving.`);
      }
    }
  }
  
  console.log(`Cleanup Complete! Assigned teams and deleted ${deletedCount} junk users.`);
}

run().catch(console.error);
