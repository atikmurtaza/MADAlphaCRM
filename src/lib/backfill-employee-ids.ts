import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function generateRandomId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function run() {
  const users = await prisma.user.findMany();
  
  for (const user of users) {
    let currentId = user.employeeId;
    
    // Assign missing IDs
    if (!currentId) {
      let uniqueFound = false;
      while (!uniqueFound) {
        currentId = generateRandomId();
        const existing = await prisma.usedEmployeeId.findUnique({ where: { employeeId: currentId } });
        if (!existing) {
          uniqueFound = true;
        }
      }
      
      await prisma.user.update({
        where: { id: user.id },
        data: { employeeId: currentId }
      });
      console.log(`Generated and assigned new ID ${currentId} to user ${user.name}`);
    }

    // Backfill into UsedEmployeeId
    if (currentId) {
      const alreadyLogged = await prisma.usedEmployeeId.findUnique({ where: { employeeId: currentId } });
      if (!alreadyLogged) {
        await prisma.usedEmployeeId.create({
          data: {
            employeeId: currentId,
            userId: user.id
          }
        });
        console.log(`Logged ${currentId} into UsedEmployeeId for user ${user.name}`);
      }
    }
  }
}

run().catch(console.error);
