import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const users = await prisma.user.findMany({
    where: {
      name: {
        in: ['Rafi', 'Bilal', 'Hamza', 'Mudassir', 'Umer Farooq', 'Umer']
      }
    },
    include: {
      team: true,
      leadsTeams: true
    }
  });

  console.log("Users found:", JSON.stringify(users, null, 2));

  const teams = await prisma.team.findMany({
    where: {
      name: {
        contains: 'Team'
      }
    },
    include: {
      leader: true
    }
  });

  console.log("Teams found:");
  for (const t of teams) {
    console.log(`- ${t.name} (Leader: ${t.leader?.name || 'None'})`);
  }
}

run().catch(console.error);
