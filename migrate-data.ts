import { PrismaClient as SQLiteClient } from '@prisma/client-sqlite';
import { PrismaClient as PostgresClient } from '@prisma/client';

const sqlite = new SQLiteClient();
const pg = new PostgresClient();

async function main() {
  console.log('Starting data migration from SQLite to PostgreSQL...');

  // Read all data from SQLite
  const salaryTiers = await sqlite.salaryTier.findMany();
  const departments = await sqlite.department.findMany();
  const users = await sqlite.user.findMany();
  const teams = await sqlite.team.findMany();
  const usedEmployeeIds = await sqlite.usedEmployeeId.findMany();
  const teamSupervisors = await sqlite.teamSupervisor.findMany();
  const teamAssistants = await sqlite.teamAssistant.findMany();
  const overrideAssignments = await sqlite.overrideAssignment.findMany();
  const clients = await sqlite.client.findMany();
  const sales = await sqlite.sale.findMany();
  const projects = await sqlite.project.findMany();
  const projectAssignments = await sqlite.projectAssignment.findMany();
  const deliverables = await sqlite.deliverable.findMany();
  const designerAssignments = await sqlite.designerAssignment.findMany();
  const paymentTransactions = await sqlite.paymentTransaction.findMany();
  const refundTransactions = await sqlite.refundTransaction.findMany();
  const compensationProfiles = await sqlite.compensationProfile.findMany();
  const commissionLedgerEntries = await sqlite.commissionLedgerEntry.findMany();
  const monthlyPayrollSnapshots = await sqlite.monthlyPayrollSnapshot.findMany();

  console.log('Data read from SQLite successfully. Inserting into PostgreSQL...');

  // Base Data without cyclical dependencies
  await pg.salaryTier.createMany({ data: salaryTiers, skipDuplicates: true });
  await pg.department.createMany({ data: departments, skipDuplicates: true });
  
  // Insert users and teams without cyclic FKs first
  const usersBase = users.map(u => ({ ...u, teamId: null }));
  const teamsBase = teams.map(t => ({ ...t, leaderId: null }));

  await pg.user.createMany({ data: usersBase, skipDuplicates: true });
  await pg.team.createMany({ data: teamsBase, skipDuplicates: true });

  // Now update the cyclic dependencies
  console.log('Updating relations...');
  for (const user of users) {
    if (user.teamId) {
      await pg.user.update({ where: { id: user.id }, data: { teamId: user.teamId } });
    }
  }
  for (const team of teams) {
    if (team.leaderId) {
      await pg.team.update({ where: { id: team.id }, data: { leaderId: team.leaderId } });
    }
  }

  // Insert remaining relations
  console.log('Inserting remaining data...');
  await pg.usedEmployeeId.createMany({ data: usedEmployeeIds, skipDuplicates: true });
  await pg.teamSupervisor.createMany({ data: teamSupervisors, skipDuplicates: true });
  await pg.teamAssistant.createMany({ data: teamAssistants, skipDuplicates: true });
  await pg.overrideAssignment.createMany({ data: overrideAssignments, skipDuplicates: true });
  
  await pg.client.createMany({ data: clients, skipDuplicates: true });
  await pg.sale.createMany({ data: sales, skipDuplicates: true });
  await pg.project.createMany({ data: projects, skipDuplicates: true });
  await pg.projectAssignment.createMany({ data: projectAssignments, skipDuplicates: true });
  await pg.deliverable.createMany({ data: deliverables, skipDuplicates: true });
  await pg.designerAssignment.createMany({ data: designerAssignments, skipDuplicates: true });
  
  await pg.paymentTransaction.createMany({ data: paymentTransactions, skipDuplicates: true });
  await pg.refundTransaction.createMany({ data: refundTransactions, skipDuplicates: true });
  
  await pg.compensationProfile.createMany({ data: compensationProfiles, skipDuplicates: true });
  await pg.commissionLedgerEntry.createMany({ data: commissionLedgerEntries, skipDuplicates: true });
  await pg.monthlyPayrollSnapshot.createMany({ data: monthlyPayrollSnapshots, skipDuplicates: true });

  console.log('Migration complete! Your Supabase database is now populated with the SQLite data.');
}

main()
  .catch(console.error)
  .finally(async () => {
    await sqlite.$disconnect();
    await pg.$disconnect();
  });
