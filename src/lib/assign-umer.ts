import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  console.log('Finding Umer Farooq...');
  
  const umer = await prisma.user.findFirst({
    where: { name: 'Umer' }
  });

  if (!umer) {
    console.error('Could not find Umer in the database.');
    return;
  }
  
  console.log(`Found Umer (ID: ${umer.id})`);

  // Update user's position and name
  await prisma.user.update({
    where: { id: umer.id },
    data: { 
      name: 'Umer Farooq',
      position: 'Team Leader' 
    }
  });

  const teams = await prisma.team.findMany({
    where: {
      name: {
        in: [
          'Team Umer Night', 
          'Team Umer (Evening - Boys)', 
          'Team Umer (Evening - Girls)'
        ]
      }
    }
  });

  for (const team of teams) {
    await prisma.team.update({
      where: { id: team.id },
      data: { leaderId: umer.id }
    });
    console.log(`Assigned Umer Farooq as leader of ${team.name}`);
  }
}

run().catch(console.error);
