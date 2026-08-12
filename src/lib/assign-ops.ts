import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const opsDept = await prisma.department.findFirst({
    where: { name: 'Operations' }
  });

  if (!opsDept) {
    console.error('Operations department not found');
    return;
  }

  let opsTeam = await prisma.team.findFirst({
    where: { name: 'Operations Management' }
  });

  if (!opsTeam) {
    opsTeam = await prisma.team.create({
      data: {
        name: 'Operations Management',
        departmentId: opsDept.id
      }
    });
    console.log('Created Operations Management team');
  }

  const talha = await prisma.user.findFirst({
    where: { name: 'Talha' }
  });

  if (talha) {
    await prisma.user.update({
      where: { id: talha.id },
      data: { teamId: opsTeam.id, position: 'Execution Manager' }
    });
    
    await prisma.team.update({
      where: { id: opsTeam.id },
      data: { leaderId: talha.id }
    });
    console.log('Assigned Talha to Operations Management and made him leader.');
  }

  // Also, any assistant execution managers?
  const aems = await prisma.user.findMany({
    where: { position: 'Assistant Execution Manager' }
  });

  for (const aem of aems) {
    if (!aem.teamId) {
      await prisma.user.update({
        where: { id: aem.id },
        data: { teamId: opsTeam.id }
      });
      console.log(`Assigned AEM ${aem.name} to Operations Management.`);
    }
  }
}

run().catch(console.error);
