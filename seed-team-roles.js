const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  const teams = await prisma.team.findMany();

  const getU = (name) => users.find(u => u.name.includes(name));
  const getT = (name) => teams.find(t => t.name.includes(name));

  const rafi = getU('Rafi');
  const umer = getU('Umer Farooq');
  const bilal = getU('Bilal');
  const hamza = getU('Hamza');
  const mudassir = getU('Mudassir');

  const tRafi = getT('Team Rafi');
  const tUmerNight = getT('Umer (Night)');
  const tUmerEvB = getT('Umer (Evening - Boys)');
  const tUmerEvG = getT('Umer (Evening - Girls)');
  const tBilal = getT('Team Bilal');
  const tHamza = getT('Team Hamza');
  const tMudassir = getT('Team Mudassir');

  // Clear existing explicit roles
  await prisma.teamSupervisor.deleteMany({});
  await prisma.teamAssistant.deleteMany({});

  // RAFI
  await prisma.team.update({
    where: { id: tRafi.id },
    data: { leaderId: rafi.id, leaderRate: 40, leaderRateType: 'CLEARED_TIERED_40_50' }
  });
  const rafiSupTeams = [tUmerNight, tUmerEvB, tUmerEvG, tBilal, tHamza, tMudassir];
  for (const t of rafiSupTeams) {
    await prisma.teamSupervisor.create({ data: { teamId: t.id, userId: rafi.id, rate: 5, type: 'CLEARED' } });
  }

  // UMER
  await prisma.team.update({
    where: { id: tUmerNight.id },
    data: { leaderId: umer.id, leaderRate: 17.5, leaderRateType: 'CLEARED' }
  });
  await prisma.team.update({
    where: { id: tUmerEvB.id },
    data: { leaderId: umer.id, leaderRate: 15, leaderRateType: 'CLEARED_BONUS_1X_FLOOR' }
  });
  await prisma.team.update({
    where: { id: tUmerEvG.id },
    data: { leaderId: umer.id, leaderRate: 15, leaderRateType: 'CLEARED_BONUS_1X_FLOOR' }
  });
  await prisma.teamSupervisor.create({ data: { teamId: tBilal.id, userId: umer.id, rate: 5, type: 'CLEARED' } });

  // BILAL
  await prisma.team.update({
    where: { id: tBilal.id },
    data: { leaderId: bilal.id, leaderRate: 15, leaderRateType: 'CLEARED' }
  });
  await prisma.teamAssistant.create({ data: { teamId: tUmerEvB.id, userId: bilal.id, rate: 7.5, type: 'TARGET' } });
  await prisma.teamAssistant.create({ data: { teamId: tUmerEvG.id, userId: bilal.id, rate: 7.5, type: 'TARGET' } });

  // HAMZA
  await prisma.team.update({
    where: { id: tHamza.id },
    data: { leaderId: hamza.id, leaderRate: 20, leaderRateType: 'CLEARED_BONUS_2X_FLOOR' }
  });
  await prisma.teamSupervisor.create({ data: { teamId: tMudassir.id, userId: hamza.id, rate: 5, type: 'TARGET' } });

  // MUDASSIR
  await prisma.team.update({
    where: { id: tMudassir.id },
    data: { leaderId: mudassir.id, leaderRate: 15, leaderRateType: 'CLEARED' }
  });
  await prisma.teamSupervisor.create({ data: { teamId: tHamza.id, userId: mudassir.id, rate: 5, type: 'TARGET' } });
  await prisma.teamSupervisor.create({ data: { teamId: tRafi.id, userId: mudassir.id, rate: 5, type: 'TARGET' } });

  console.log("Seeding complete.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
