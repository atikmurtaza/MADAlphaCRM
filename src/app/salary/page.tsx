import { PrismaClient } from '@prisma/client'
import Link from 'next/link'

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL || "file:./dev.db"
})

export default async function SalaryLoginSwitcher() {
  const users = await prisma.user.findMany({
    orderBy: { position: 'asc' }
  })

  return (
    <div className="container">
      <h1 className="text-2xl font-bold" style={{ marginBottom: '1rem' }}>Salary Module Demo</h1>
      <p className="text-secondary" style={{ marginBottom: '2rem' }}>
        Select a user to "log in" as. This demonstrates the dynamic permission engine.
      </p>
      
      <div className="grid" style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
        {users.map(u => (
          <Link href={`/salary/${u.id}`} key={u.id}>
            <div className="card">
              <div className="flex items-center justify-between">
                <span className="font-bold">{u.name}</span>
                <span className="badge primary">{u.position}</span>
              </div>
              <div className="text-sm text-secondary" style={{ marginTop: '0.5rem' }}>{u.email}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
