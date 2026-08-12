const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const RENAME_MAP = [
  { oldNameStarts: 'Tier 1:', newName: 'Tier 1: $1000/60k' },
  { oldNameStarts: 'Tier 2:', newName: 'Tier 2: $500/25k' },
  { oldNameStarts: 'Tier 3:', newName: 'Tier 3: 12.5k fixed' },
  { oldNameStarts: 'Tier 4:', newName: 'Tier 4: 10k fixed' },
  { oldNameStarts: 'Tier 5:', newName: 'Tier 5: 15k fixed' },
  { oldNameStarts: 'Tier 6:', newName: 'Tier 6: $1000/70k' },
  { oldNameStarts: 'Tier 7:', newName: 'Tier 7: $1000/50k' }
];

async function main() {
  const tiers = await prisma.salaryTier.findMany();
  
  for (const mapping of RENAME_MAP) {
    const tier = tiers.find(t => t.name.startsWith(mapping.oldNameStarts));
    if (tier) {
      await prisma.salaryTier.update({
        where: { id: tier.id },
        data: { name: mapping.newName }
      });
      console.log(`Updated ${tier.name} -> ${mapping.newName}`);
    } else {
      console.log(`Could not find tier starting with ${mapping.oldNameStarts}`);
    }
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
