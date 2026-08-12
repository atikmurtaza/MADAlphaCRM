const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Previous names are:
// Tier 1: $1000/60k
// Tier 2: $500/25k
// Tier 3: 12.5k fixed
// Tier 4: 10k fixed
// Tier 5: 15k fixed
// Tier 6: $1000/70k
// Tier 7: $1000/50k

const UPDATE_MAP = [
  { match: 'Tier 6: $1000/70k', newName: 'Tier 1: Capped Bonus', desc: 'Rate: 50, Cap: 50k. Bonus: Capped at 20k. Comm: 40x over 1k.' },
  { match: 'Tier 1: $1000/60k', newName: 'Tier 2: Standard 50/50k', desc: 'Rate: 50, Cap: 50k. Bonus: 10k per 1k target. Commission: 40x on target over 1k.' },
  { match: 'Tier 7: $1000/50k', newName: 'Tier 3: Delayed Bonus', desc: 'Rate: 50, Cap: 50k. Bonus: Starts at 2k target for 10k, then 10k per 1k. Comm: 40x over 1k.' },
  { match: 'Tier 2: $500/25k', newName: 'Tier 4: Variable Threshold', desc: 'If >499: Rate 50/Cap 25k, Else: Rate 40/Cap 20k. Bonus: 5k up to 2k, 20k at 3k. Comm: 40x over 500.' },
  { match: 'Tier 5: 15k fixed', newName: 'Tier 5: 15k fixed', desc: 'If <=300: 15k, Else: Rate 40/Cap 40k. Bonus: 5k up to 2k, 20k at 3k. Comm: 40x over 500.' },
  { match: 'Tier 3: 12.5k fixed', newName: 'Tier 6: 12.5k fixed', desc: 'If <=300: 12.5k, Else: Rate 50/Cap 50k. Bonus: 10k per 1k target. Comm: 40x over 1k.' },
  { match: 'Tier 4: 10k fixed', newName: 'Tier 7: 10k fixed', desc: 'If <=300: 10k, Else: Rate 40/Cap 40k. Bonus: 5k up to 2k, 20k at 3k. Comm: 40x over 1k.' }
];

async function main() {
  const tiers = await prisma.salaryTier.findMany();
  
  for (const item of UPDATE_MAP) {
    const tier = tiers.find(t => t.name === item.match);
    if (tier) {
      await prisma.salaryTier.update({
        where: { id: tier.id },
        data: { name: item.newName, description: item.desc }
      });
      console.log(`Updated to ${item.newName}`);
    } else {
      console.log(`Failed to find ${item.match}`);
    }
  }

  // Create Tier 8
  const existingTier8 = tiers.find(t => t.name.startsWith('Tier 8'));
  if (!existingTier8) {
    await prisma.salaryTier.create({
      data: {
        name: 'Tier 8: 5k fixed',
        description: 'If <=300: 5k, Else: Rate 40/Cap 40k. Bonus: 5k up to 2k, 20k at 3k. Comm: 40x over 1k.'
      }
    });
    console.log('Created Tier 8: 5k fixed');
  } else {
    console.log('Tier 8 already exists.');
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
