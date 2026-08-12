import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function generateId() {
  return 'INV-' + Math.random().toString(36).substring(2, 8).toUpperCase();
}

async function backfillIds() {
  const sales = await prisma.sale.findMany({
    where: {
      OR: [
        { customSaleId: null },
        { customSaleId: '' }
      ]
    }
  });

  console.log(`Found ${sales.length} sales needing custom IDs.`);

  let updated = 0;
  for (const sale of sales) {
    await prisma.sale.update({
      where: { id: sale.id },
      data: { customSaleId: generateId() }
    });
    updated++;
  }

  console.log(`Successfully backfilled ${updated} sales.`);
}

backfillIds().catch(console.error);
