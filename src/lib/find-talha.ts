import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const talha = await prisma.user.findFirst({
    where: { name: { contains: 'Talha' } }
  });
  console.log('Talha:', talha);
}

run().catch(console.error);
