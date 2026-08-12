import { PrismaClient } from '@prisma/client';
import DashboardClient from './DashboardClient';

const prisma = new PrismaClient();

export default async function EmployeeDashboardPage({ params }: { params: Promise<{ userId: string }> }) {
  const resolvedParams = await params;
  
  const user = await prisma.user.findUnique({
    where: { id: resolvedParams.userId },
    include: { team: true }
  });

  if (!user) return <div className="container">User not found</div>;

  // Fetch sales
  const sales = await prisma.sale.findMany({
    where: { 
      agentId: user.id,
      approvalStatus: 'APPROVED'
    },
    include: {
      agent: true,
      client: true,
      payments: true,
      refunds: true,
      project: { include: { assignments: { include: { employee: true } } } }
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="container" style={{ maxWidth: '1400px' }}>
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">M</div>
          <div>
            <div className="page-eyebrow">Employee Portal</div>
            <div className="brand-title">Welcome, {user.name}</div>
            <div className="brand-sub">Team: {user.team?.name || 'Unassigned'}</div>
          </div>
        </div>
        <a href="/" className="btn secondary">Logout</a>
      </header>

      <DashboardClient 
        user={user} 
        initialSales={sales as any} 
      />
    </div>
  );
}
