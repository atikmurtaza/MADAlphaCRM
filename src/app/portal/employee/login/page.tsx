import { PrismaClient } from '@prisma/client';
import LoginForm from './LoginForm';

const prisma = new PrismaClient();

export default async function EmployeeLoginPage() {
  const teams = await prisma.team.findMany({
    include: { members: true },
    orderBy: { name: 'asc' }
  });

  return (
    <div className="container" style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Employee Login</h2>
        <LoginForm teams={teams} />
      </div>
    </div>
  );
}
