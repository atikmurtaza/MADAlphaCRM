import { PrismaClient } from '@prisma/client';
import AdminDashboardClient from './AdminDashboardClient';

const prisma = new PrismaClient();

export default async function AdminDashboardPage() {
  const departments = await prisma.department.findMany({
    include: {
      users: true,
      teams: {
        include: {
          leader: true,
          supervisors: { include: { user: true } },
          assistantLeaders: { include: { user: true } },
          members: true,
          sales: {
            include: { payments: true }
          }
        }
      }
    }
  });

  const unassignedEmployees = await prisma.user.findMany({
    where: { teamId: null },
    include: { leadsTeams: true }
  });

  const totalEmployees = await prisma.user.count({
    where: { isActive: true }
  });

  const salaryTiers = await prisma.salaryTier.findMany({
    include: { users: { include: { team: true } } },
    orderBy: { name: 'asc' }
  });

  return (
    <div className="container">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">M</div>
          <div>
            <div className="page-eyebrow">Admin Portal</div>
            <div className="brand-title">MAD Alpha HQ</div>
          </div>
        </div>
        <a href="/" className="btn secondary">Logout</a>
      </header>

      <AdminDashboardClient 
        departments={departments as any} 
        unassignedEmployees={unassignedEmployees as any}
        totalEmployees={totalEmployees}
        salaryTiers={salaryTiers as any}
      />
    </div>
  );
}
