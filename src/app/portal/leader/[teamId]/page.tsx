import { PrismaClient } from '@prisma/client';
import LeaderDashboardClient from './LeaderDashboardClient';
import { notFound } from 'next/navigation';

const prisma = new PrismaClient();

export default async function LeaderDashboardPage({ params }: { params: Promise<{ teamId: string }> }) {
  const resolvedParams = await params;
  
  const team = await prisma.team.findUnique({
    where: { id: resolvedParams.teamId },
    include: {
      leader: true,
      members: true,
      formerMembers: true
    }
  });

  if (!team) notFound();

  // Fetch all sales for this team
  const sales = await prisma.sale.findMany({
    where: { teamId: team.id },
    include: {
      agent: true,
      client: true,
      payments: true,
      refunds: true,
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
            <div className="page-eyebrow">Team Leader Portal</div>
            <div className="brand-title">{team.name}</div>
            <div className="brand-sub">
              Leader: <strong>{team.leader ? team.leader.name : 'Unassigned'}</strong> · {team.members.length} members
            </div>
          </div>
        </div>
        <a href="/" className="btn secondary">Logout</a>
      </header>

      <LeaderDashboardClient 
        team={team} 
        sales={sales as any} 
      />
    </div>
  );
}
