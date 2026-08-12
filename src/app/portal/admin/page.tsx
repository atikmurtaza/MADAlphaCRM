import { PrismaClient } from '@prisma/client';
import { requireAuth } from "@/lib/auth-utils";
import AdminDashboardClient from './AdminDashboardClient';
import { logout } from "@/app/auth/actions";

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
        <div className="flex gap-4">
          <a href="/admin/users" className="btn secondary">User Management</a>
          <a href="/dashboard" className="btn secondary">Back to Dashboard</a>
          <form action={logout}>
            <button type="submit" className="btn secondary">Logout</button>
          </form>
        </div>
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
