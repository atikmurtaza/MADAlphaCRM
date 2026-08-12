const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tier = await prisma.salaryTier.findFirst({
    where: { name: 'Tier 8: 5k fixed' }
  });
  
  if (tier) {
    await prisma.salaryTier.update({
      where: { id: tier.id },
      data: {
        description: 'If <=100: 5k, Else: 5k + (Target-100)*37.5, Capped at 20k. Bonus: 5k up to 2k, 20k at 3k. Comm: 40x over 500.'
      }
    });
    console.log('Tier 8 updated successfully.');
  } else {
    console.log('Tier 8 not found.');
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
