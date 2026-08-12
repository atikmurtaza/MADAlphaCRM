import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const sale = await prisma.sale.findFirst({
    include: { client: true }
  });
  console.log(sale);
}

check().catch(console.error);
