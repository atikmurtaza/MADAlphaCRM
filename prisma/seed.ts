import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // Clear existing

  await prisma.teamSupervisor.deleteMany()
  await prisma.teamAssistant.deleteMany()
  await prisma.team.deleteMany()
  await prisma.user.deleteMany()

  // Create Users (Team Leaders)
  const rafi = await prisma.user.create({ data: { name: 'Rafi', email: 'rafi@test.com', position: 'Team Leader', baseSalary: 50000 } })
  const umer = await prisma.user.create({ data: { name: 'Umer', email: 'umer@test.com', position: 'Team Leader', baseSalary: 50000 } })
  const bilal = await prisma.user.create({ data: { name: 'Bilal', email: 'bilal@test.com', position: 'Team Leader', baseSalary: 50000 } })
  const hamza = await prisma.user.create({ data: { name: 'Hamza', email: 'hamza@test.com', position: 'Team Leader', baseSalary: 50000 } })
  const mudassir = await prisma.user.create({ data: { name: 'Mudassir', email: 'mudassir@test.com', position: 'Team Leader', baseSalary: 50000 } })

  // Admin
  const admin = await prisma.user.create({ data: { name: 'Admin', email: 'admin@test.com', position: 'Admin', baseSalary: 0 } })

  // Create Teams
  const teamRafi = await prisma.team.create({ data: { name: 'Team Rafi', leaderId: rafi.id, commissionRate: 40 } })
  const teamUmerNight = await prisma.team.create({ data: { name: 'Umer Night', leaderId: umer.id, commissionRate: 17.5 } })
  const teamUmerEvBoys = await prisma.team.create({ data: { name: 'Umer Evening - Boys', leaderId: umer.id, commissionRate: 15 } })
  const teamUmerEvGirls = await prisma.team.create({ data: { name: 'Umer Evening - Girls', leaderId: umer.id, commissionRate: 15 } })
  const teamBilal = await prisma.team.create({ data: { name: 'Team Bilal', leaderId: bilal.id, commissionRate: 15 } })
  const teamHamza = await prisma.team.create({ data: { name: 'Team Hamza', leaderId: hamza.id, commissionRate: 20 } })
  const teamMudassir = await prisma.team.create({ data: { name: 'Team Mudassir', leaderId: mudassir.id, commissionRate: 15 } })

  // Supervisor Assignments
  // Bilal supervises Umer Ev Boys (7.5) and Umer Ev Girls (7.5)
  await prisma.teamSupervisor.create({ data: { userId: bilal.id, teamId: teamUmerEvBoys.id, rate: 7.5 } })
  await prisma.teamSupervisor.create({ data: { userId: bilal.id, teamId: teamUmerEvGirls.id, rate: 7.5 } })
  // Hamza supervises Mudassir (5)
  await prisma.teamSupervisor.create({ data: { userId: hamza.id, teamId: teamMudassir.id, rate: 5 } })
  // Mudassir supervises Umer Night (5) and Hamza (5)
  await prisma.teamSupervisor.create({ data: { userId: mudassir.id, teamId: teamUmerNight.id, rate: 5 } })
  await prisma.teamSupervisor.create({ data: { userId: mudassir.id, teamId: teamHamza.id, rate: 5 } })

  // Leadership Overrides
  // Rafi overrides 6 teams (5)
  const rafiOverrideTeams = [teamUmerNight, teamUmerEvBoys, teamUmerEvGirls, teamBilal, teamHamza, teamMudassir]
  for (const t of rafiOverrideTeams) {
    await prisma.teamSupervisor.create({ data: { userId: rafi.id, teamId: t.id, rate: 5 } })
  }
  // Umer overrides Bilal (5)
  await prisma.teamSupervisor.create({ data: { userId: umer.id, teamId: teamBilal.id, rate: 5 } })

  console.log("Seeding complete.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
