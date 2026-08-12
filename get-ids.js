const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { position: 'Team Leader' },
    select: { id: true, name: true }
  });
  console.log("TEAM LEADERS:");
  console.table(users);

  const teams = await prisma.team.findMany({
    select: { id: true, name: true }
  });
  console.log("\nTEAMS:");
  console.table(teams);
}

main().catch(console.error).finally(() => prisma.$disconnect());
