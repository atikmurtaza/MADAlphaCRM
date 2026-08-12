import { PrismaClient } from '@prisma/client';
import Link from 'next/link';

const prisma = new PrismaClient();

export default async function OperationsLogin() {
  let managers = await prisma.user.findMany({
    where: {
      position: {
        in: ['Execution Manager', 'Assistant Execution Manager']
      }
    }
  });

  if (managers.length === 0) {
    const talha = await prisma.user.create({
      data: {
        name: 'Talha',
        email: 'talha@em.local',
        position: 'Execution Manager',
        baseSalary: 100000
      }
    });
    managers = [talha];
  }

  // If there are no execution managers, we should ideally have a script to seed them, 
  // but for the sake of the login page, we'll just list what's available.

  return (
    <div className="container" style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <h1 style={{ marginBottom: '1.5rem' }}>Operations Login</h1>
        
        {managers.length === 0 ? (
          <p className="text-secondary" style={{ marginBottom: '1.5rem' }}>
            No Execution Managers found in the database. Please ensure 'Execution Manager - Talha' is created.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {managers.map(m => (
              <Link 
                key={m.id} 
                href={`/operations/${m.id}/projects`} 
                className="btn secondary" 
                style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between' }}
              >
                <span>{m.name}</span>
                <span className="text-secondary" style={{ fontSize: '0.8rem' }}>
                  {m.position} • {m.employeeId || 'No ID'}
                </span>
              </Link>
            ))}
          </div>
        )}

        <div style={{ marginTop: '2rem' }}>
          <Link href="/" className="text-secondary" style={{ textDecoration: 'underline', fontSize: '0.9rem' }}>← Back to Workspace</Link>
        </div>
      </div>
    </div>
  );
}
