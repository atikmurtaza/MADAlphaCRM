import { PrismaClient } from '@prisma/client';
import LeaderLoginForm from './LeaderLoginForm';

const prisma = new PrismaClient();

export default async function LeaderLoginPage() {
  // Fetch all teams
  const teams = await prisma.team.findMany({
    orderBy: { name: 'asc' }
  });

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
        <h1 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Team Leader Login</h1>
        <LeaderLoginForm teams={teams} />
      </div>
    </div>
  );
}
