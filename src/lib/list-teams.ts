import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkTeams() {
  const teams = await prisma.team.findMany();
  console.log("Existing Teams:");
  teams.forEach(t => console.log(`- "${t.name}" (ID: ${t.id})`));
}

checkTeams().catch(console.error);
