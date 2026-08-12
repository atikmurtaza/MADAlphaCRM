import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const sales = await prisma.sale.findMany({ where: { status: 'COMPLETED' }, take: 10, select: { agentId: true, createdAt: true, clearedAt: true, targetAmount: true } });
  console.log(sales);
}
run();
