import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const team = await prisma.team.findFirst({
    where: { name: 'Operations Management' }
  });

  if (team) {
    await prisma.team.update({
      where: { id: team.id },
      data: { name: 'Execution' }
    });
    console.log('Renamed Operations Management to Execution');
  } else {
    console.log('Operations Management team not found');
  }
}

run().catch(console.error);
