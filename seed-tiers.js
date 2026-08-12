const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TIERS = [
  {
    name: 'Tier 1: Standard 50 / 50k',
    description: 'Rate: 50, Cap: 50k. Bonus: 10k per 1k target. Commission: 40x on target over 1k.'
  },
  {
    name: 'Tier 2: Variable Threshold',
    description: 'If >499: Rate 50/Cap 25k, Else: Rate 40/Cap 20k. Bonus: 5k up to 2k, 20k at 3k. Comm: 40x over 500.'
  },
  {
    name: 'Tier 3: Min. Guarantee 12.5k',
    description: 'If <=300: 12.5k, Else: Rate 50/Cap 50k. Bonus: 10k per 1k target. Comm: 40x over 1k.'
  },
  {
    name: 'Tier 4: Min. Guarantee 10k',
    description: 'If <=300: 10k, Else: Rate 40/Cap 40k. Bonus: 5k up to 2k, 20k at 3k. Comm: 40x over 1k.'
  },
  {
    name: 'Tier 5: Min. Guarantee 15k',
    description: 'If <=300: 15k, Else: Rate 40/Cap 40k. Bonus: 5k up to 2k, 20k at 3k. Comm: 40x over 500.'
  },
  {
    name: 'Tier 6: Capped Bonus',
    description: 'Rate: 50, Cap: 50k. Bonus: Capped at 20k. Comm: 40x over 1k.'
  },
  {
    name: 'Tier 7: Delayed Bonus',
    description: 'Rate: 50, Cap: 50k. Bonus: Starts at 2k target for 10k, then 10k per 1k. Comm: 40x over 1k.'
  }
];

async function main() {
  for (const tier of TIERS) {
    await prisma.salaryTier.upsert({
      where: { name: tier.name },
      update: { description: tier.description },
      create: tier
    });
  }
  console.log('Successfully seeded salary tiers.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
