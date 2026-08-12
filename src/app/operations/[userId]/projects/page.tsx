import { PrismaClient } from '@prisma/client';
import EMDashboardClient from './EMDashboardClient';
import { notFound } from 'next/navigation';

const prisma = new PrismaClient();

export default async function ExecutionManagerDashboardPage({ params }: { params: Promise<{ userId: string }> }) {
  const resolvedParams = await params;
  
  const user = await prisma.user.findUnique({
    where: { id: resolvedParams.userId }
  });

  if (!user) notFound();

  // Ensure they are Operations/EM
  if (user.position !== 'Execution Manager' && user.position !== 'Assistant Execution Manager') {
    notFound();
  }

  // Fetch all AEMs to populate assignment dropdown
  const aems = await prisma.user.findMany({
    where: { position: 'Assistant Execution Manager' }
  });

  // Fetch all teams
  const teams = await prisma.team.findMany({
    orderBy: { name: 'asc' }
  });

  // Fetch all sales across all teams with details and project assignments
  const sales = await prisma.sale.findMany({
    include: {
      agent: true,
      client: true,
      payments: true,
      refunds: true,
      team: true,
      project: {
        include: {
          assignments: {
            include: { employee: true }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="container">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">M</div>
          <div>
            <div className="page-eyebrow">Operations · {user.position}</div>
            <div className="brand-title">Operations Workspace</div>
            <div className="brand-sub">Signed in as <strong>{user.name}</strong></div>
          </div>
        </div>
        <a href="/operations/login" className="btn secondary">Logout</a>
      </header>

      <EMDashboardClient 
        user={user}
        aems={aems}
        teams={teams}
        sales={sales as any} 
      />
    </div>
  );
}
