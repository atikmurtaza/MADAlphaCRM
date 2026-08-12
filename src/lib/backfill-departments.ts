import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const users = await prisma.user.findMany({
    include: { team: true }
  });

  for (const user of users) {
    if (user.team && user.team.departmentId) {
      await prisma.user.update({
        where: { id: user.id },
        data: { departmentId: user.team.departmentId }
      });
    } else {
      // If unassigned or team has no department, try to infer from position or just leave null
      if (user.position === 'Team Leader' || user.position === 'Employee') {
        const salesDept = await prisma.department.findFirst({ where: { name: 'Sales' } });
        if (salesDept) {
          await prisma.user.update({
            where: { id: user.id },
            data: { departmentId: salesDept.id }
          });
        }
      }
    }
  }
  console.log('Backfill complete.');
}

run().catch(console.error);
