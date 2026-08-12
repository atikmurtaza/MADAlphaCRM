import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runMigration() {
  console.log('Starting department migration...');

  const departments = ['Sales', 'Operations', 'People'];

  for (const name of departments) {
    await prisma.department.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const salesDept = await prisma.department.findUnique({ where: { name: 'Sales' } });
  
  if (salesDept) {
    const teams = await prisma.team.findMany();
    for (const team of teams) {
      if (!team.departmentId) {
        await prisma.team.update({
          where: { id: team.id },
          data: { departmentId: salesDept.id }
        });
        console.log(`Updated team ${team.name} -> Sales`);
      }
    }
  }

  console.log('Migration complete!');
}

runMigration().catch(console.error);
