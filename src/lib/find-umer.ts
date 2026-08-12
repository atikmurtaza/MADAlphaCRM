import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const users = await prisma.user.findMany({
    where: { name: { contains: 'Umer' } }
  });

  console.log(users.map(u => u.name));
}

run().catch(console.error);
