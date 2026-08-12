import { getDashboardDataForUser } from '@/lib/permissions'
import Link from 'next/link'

export default async function UserSalaryDashboard({ params }: { params: { userId: string } }) {
  const { userId } = await params;
  const { permissions, teamsData } = await getDashboardDataForUser(userId)

  return (
    <div className="container">
      <div className="flex items-center gap-4" style={{ marginBottom: '2rem' }}>
        <Link href="/salary" className="badge" style={{ padding: '0.5rem 1rem' }}>← Back</Link>
        <h1 className="text-2xl font-bold">Dashboard: {permissions.user.name}</h1>
        <span className="badge primary">{permissions.user.position}</span>
      </div>

      <section style={{ marginBottom: '3rem' }}>
        <h2 className="text-xl font-bold" style={{ marginBottom: '1rem' }}>My Salary Package</h2>
        <div className="card">
          <p>Base Salary: PKR {permissions.user.baseSalary.toLocaleString()}</p>
          <p className="text-sm text-secondary" style={{ marginTop: '0.5rem' }}>
            (Full calculation engine will populate bonuses, commissions, and allowances here)
          </p>
        </div>
      </section>

      {teamsData.length > 0 && (
        <section>
          <h2 className="text-xl font-bold" style={{ marginBottom: '1rem' }}>Teams Visibility</h2>
          <div className="grid" style={{ display: 'grid', gap: '2rem' }}>
            {teamsData.map(team => (
              <div key={team.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="flex justify-between items-center" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
                  <h3 className="text-lg font-bold">{team.name}</h3>
                  <div style={{ display: 'flex', gap: '1rem', textAlign: 'right' }}>
                    <div>
                      <div className="text-sm text-secondary">Team Target</div>
                      <div className="font-bold">${team.teamTarget.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-sm text-secondary">Team Cleared</div>
                      <div className="font-bold text-success">${team.teamCleared.toLocaleString()}</div>
                    </div>
                  </div>
                </div>

                {/* Employees Table */}
                <div>
                  <h4 className="font-bold" style={{ marginBottom: '1rem' }}>Employees</h4>
                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Role</th>
                          <th>Target (All Time)</th>
                          <th>Cleared (All Time)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {team.members.length === 0 ? (
                          <tr><td colSpan={4} className="text-secondary text-center">No employees found.</td></tr>
                        ) : (
                          team.members.map(m => (
                            <tr key={m.id}>
                              <td>{m.name}</td>
                              <td>{m.position}</td>
                              <td>${m.target.toLocaleString()}</td>
                              <td>${m.cleared.toLocaleString()}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Supervisor Payments Table */}
                {(team.supervisors.length > 0 || team.assistantLeaders?.length > 0) && (
                  <div>
                    <h4 className="font-bold" style={{ marginBottom: '1rem' }}>Supervisor & Assistant Team Leader Payments</h4>
                    <div className="table-wrapper">
                      <table>
                        <thead>
                          <tr>
                            <th>Supervisor</th>
                            <th>Role Type</th>
                            <th>Rate (per USD)</th>
                            <th>Earned from this team</th>
                          </tr>
                        </thead>
                        <tbody>
                          {team.supervisors.map(s => (
                            <tr key={s.id}>
                              <td>{s.user.name}</td>
                              <td><span className="badge">Supervisor</span></td>
                              <td>PKR {s.rate}</td>
                              <td className="text-secondary">PKR {(team.teamTarget * s.rate).toLocaleString()}</td>
                            </tr>
                          ))}
                          {team.assistantLeaders?.map((a: any) => (
                            <tr key={`a-${a.id}`} style={{ borderBottom: '1px solid var(--border-subtle)' }} className="hover-row">
                              <td style={{ padding: '0.75rem 1rem' }}>{a.user?.name}</td>
                              <td style={{ padding: '0.75rem 1rem' }}>Assistant Team Leader</td>
                              <td style={{ padding: '0.75rem 1rem' }}>Rs{a.rate} (/{a.type === 'TARGET' ? 'Target' : 'Cleared'})</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
