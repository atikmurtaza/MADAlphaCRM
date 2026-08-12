import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const merges = [
  // Team Hamza
  { duplicate: 'Ali Hasan', primary: 'Ali Hassan' },
  { duplicate: 'Maira Mehmood', primary: 'Mayra Mehmood' }, // Note: user said "Mayra mehmood and Maira Mehmood are Mayra Mehmood", so duplicate is Maira
  { duplicate: 'Urwa', primary: 'Urwa Amjad' },
  // Team Mudassir
  { duplicate: 'Arhum Sheikh', primary: 'Arham Sheikh' }, // "Arham Sheikh and Arhum Sheikh are Arham Sheikh"
  // Team Rafi
  { duplicate: 'Mohib Akbar Ali', primary: 'Mohib Akber Ali' },
  // Team Umer (Evening - Boys)
  { duplicate: 'Ayan', primary: 'Ayan Zaidi' },
  { duplicate: 'Hammad Ullah Khan', primary: 'Hammadullah Khan' },
  { duplicate: 'Sohaib Gujjar', primary: 'Shoaib Gujjar' },
  // Team Umer (Evening - Girls)
  { duplicate: 'Maheen', primary: 'Maheen Raza' },
  { duplicate: 'Mahnoor', primary: 'Mahnoor Rauf' }
];

async function runMerge() {
  console.log('Starting employee merge...');
  const users = await prisma.user.findMany();
  
  for (const rule of merges) {
    const dupUser = users.find(u => u.name.toLowerCase() === rule.duplicate.toLowerCase());
    const priUser = users.find(u => u.name.toLowerCase() === rule.primary.toLowerCase());
    
    if (!dupUser) {
      console.log(`[SKIP] Duplicate user not found: ${rule.duplicate}`);
      continue;
    }
    if (!priUser) {
      console.log(`[SKIP] Primary user not found: ${rule.primary}. (Renaming duplicate instead)`);
      // If primary doesn't exist, we can just rename the duplicate to the primary name
      await prisma.user.update({
        where: { id: dupUser.id },
        data: { name: rule.primary }
      });
      console.log(`-> Renamed ${rule.duplicate} to ${rule.primary}`);
      continue;
    }
    
    console.log(`[MERGE] ${dupUser.name} -> ${priUser.name}`);
    
    // 1. Reassign Sales
    const sales = await prisma.sale.updateMany({
      where: { agentId: dupUser.id },
      data: { agentId: priUser.id }
    });
    console.log(`   - Moved ${sales.count} sales`);
    
    // 2. Reassign Project Assignments
    const projects = await prisma.projectAssignment.updateMany({
      where: { employeeId: dupUser.id },
      data: { employeeId: priUser.id }
    });
    console.log(`   - Moved ${projects.count} project assignments`);
    
    // 3. Reassign Designer Assignments
    await prisma.designerAssignment.updateMany({
      where: { employeeId: dupUser.id },
      data: { employeeId: priUser.id }
    });
    
    // 4. Cleanup duplicate's Compensation Profile
    await prisma.compensationProfile.deleteMany({
      where: { userId: dupUser.id }
    });
    
    // 5. Delete duplicate User
    await prisma.user.delete({
      where: { id: dupUser.id }
    });
    
    console.log(`-> Successfully merged and deleted ${dupUser.name}`);
  }
  
  console.log('Merge complete!');
}

runMerge().catch(console.error);
