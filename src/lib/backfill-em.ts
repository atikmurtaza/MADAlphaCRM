import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Finding Talha (Execution Manager)...');
  
  const emUsers = await prisma.user.findMany({
    where: { position: 'Execution Manager' }
  });
  
  if (emUsers.length === 0) {
    console.error('No Execution Manager found in database.');
    return;
  }
  
  const talha = emUsers.find(u => u.name.toLowerCase().includes('talha')) || emUsers[0];
  console.log(`Found Execution Manager: ${talha.name} (${talha.id})`);
  
  const projects = await prisma.project.findMany({
    include: { assignments: true }
  });
  
  console.log(`Found ${projects.length} projects.`);
  let count = 0;
  
  for (const p of projects) {
    const hasPrimaryEM = p.assignments.some(a => a.role === 'PRIMARY_EXECUTION_MANAGER');
    if (!hasPrimaryEM) {
      await prisma.projectAssignment.create({
        data: {
          projectId: p.id,
          employeeId: talha.id,
          role: 'PRIMARY_EXECUTION_MANAGER'
        }
      });
      count++;
    }
  }
  
  console.log(`Assigned ${talha.name} to ${count} projects successfully.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
