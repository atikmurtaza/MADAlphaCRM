import * as fs from 'fs';

let content = fs.readFileSync('src/app/portal/admin/AdminDashboardClient.tsx', 'utf8');

const startIndex = content.indexOf('function SalariesTab()');
const endIndex = content.indexOf('// UI COMPONENTS');

if (startIndex !== -1 && endIndex !== -1) {
  const startContent = content.substring(0, startIndex);
  const endContent = content.substring(endIndex - 80); // To include the // ----------- comment before it

  const newSalariesTab = `function SalariesTab() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeRoleFilter, setActiveRoleFilter] = useState<'Agents' | 'Team Leaders' | 'Others'>('Agents');

  const loadSalaries = () => {
    setLoading(true);
    getMonthlySalaries().then(res => {
      setData(res);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadSalaries();
  }, []);

  if (loading) return <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>Loading Salaries...</div>;

  return (
    <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
      <style>{\`
        details > summary.hide-marker {
          list-style: none;
        }
        details > summary.hide-marker::-webkit-details-marker {
          display: none;
        }
        .role-sidebar {
          width: 250px;
          flex-shrink: 0;
          position: sticky;
          top: 2rem;
        }
        .role-btn {
          display: block;
          width: 100%;
          text-align: left;
          padding: 1rem;
          margin-bottom: 0.5rem;
          background: var(--surface);
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          color: var(--text-secondary);
          transition: all 0.2s;
        }
        .role-btn:hover {
          background: var(--surface-hover);
        }
        .role-btn.active {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
        }
      \`}</style>
      
      <div className="role-sidebar">
        <div className="card" style={{ padding: '1rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Filter by Role</h3>
          <button 
            className={\`role-btn \${activeRoleFilter === 'Agents' ? 'active' : ''}\`}
            onClick={() => setActiveRoleFilter('Agents')}
          >
            Sale Agents
          </button>
          <button 
            className={\`role-btn \${activeRoleFilter === 'Team Leaders' ? 'active' : ''}\`}
            onClick={() => setActiveRoleFilter('Team Leaders')}
          >
            Sale Team Leaders
          </button>
          <button 
            className={\`role-btn \${activeRoleFilter === 'Others' ? 'active' : ''}\`}
            onClick={() => setActiveRoleFilter('Others')}
          >
            Others
          </button>
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {data.map((monthData, idx) => {
          const filteredSalaries = monthData.salaries.filter((s: any) => {
            if (activeRoleFilter === 'Agents') {
              return s.role === 'Employee' && s.teamName !== 'Unassigned';
            } else if (activeRoleFilter === 'Team Leaders') {
              return s.role === 'Team Leader' || s.role === 'Supervisor' || s.role === 'Assistant Team Leader';
            } else {
              // Others
              return s.role !== 'Employee' && s.role !== 'Team Leader' && s.role !== 'Supervisor' && s.role !== 'Assistant Team Leader' || (s.role === 'Employee' && s.teamName === 'Unassigned');
            }
          });

          if (filteredSalaries.length === 0) return null;

          return (
            <div key={monthData.month} className="card" style={{ marginBottom: '2rem' }}>
              <h2 style={{ marginBottom: '1.5rem', borderBottom: '2px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                {new Date(monthData.month + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}
              </h2>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Role</th>
                      <th>Target</th>
                      <th>Cleared</th>
                      <th>Base</th>
                      <th>Bonus</th>
                      <th>Commission</th>
                      <th>Previous Commission</th>
                      <th>Allowance</th>
                      <th>Total Salary</th>
                      <th>Breakdown</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSalaries.map((s: any) => (
                      <tr key={s.userId} className="hover-row">
                        <td>
                          <div style={{ fontWeight: 600 }}>{s.userName}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{s.teamName}</div>
                        </td>
                        <td>
                          <span style={{
                            padding: '0.2rem 0.5rem',
                            borderRadius: '12px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            backgroundColor: s.role === 'Team Leader' ? 'rgba(99, 102, 241, 0.1)' : 
                                             s.role === 'Employee' ? 'rgba(16, 185, 129, 0.1)' : 
                                             'rgba(245, 158, 11, 0.1)',
                            color: s.role === 'Team Leader' ? 'var(--primary)' : 
                                   s.role === 'Employee' ? 'var(--success)' : 
                                   'var(--warning)'
                          }}>
                            {s.role}
                          </span>
                        </td>
                        <td>\${s.uPerfTarget.toLocaleString()}</td>
                        <td style={{ color: 'var(--success)' }}>\${s.uPerfCleared.toLocaleString()}</td>
                        <td>Rs {s.baseSalary.toLocaleString()}</td>
                        <td>Rs {s.bonus.toLocaleString()}</td>
                        <td>Rs {s.commission.toLocaleString()}</td>
                        <td>
                          {s.previousBreakdownWithRs && s.previousBreakdownWithRs.length > 0 ? (
                            <details style={{ margin: 0 }}>
                              <summary style={{ cursor: 'pointer', color: 'var(--primary)', fontWeight: 'normal', listStyle: 'none' }} className="hide-marker">
                                Rs {s.previousCommission.toLocaleString()}
                              </summary>
                              <ul style={{ paddingLeft: '0', marginTop: '0.5rem', fontSize: '0.85rem', listStyle: 'none', color: 'var(--text-secondary)', background: 'var(--surface-sunken)', padding: '0.5rem', borderRadius: '4px' }}>
                                {s.previousBreakdownWithRs.map((pb: any, idx: number) => (
                                  <li key={idx} style={{ marginBottom: '0.25rem' }}>
                                    <span style={{ fontWeight: 600, color: 'var(--text)' }}>{new Date(pb.month + '-01').toLocaleString('default', { month: 'short', year: 'numeric' })}</span>: \${pb.amountUSD.toLocaleString()} (Rs {pb.amountRs.toLocaleString()})
                                  </li>
                                ))}
                              </ul>
                            </details>
                          ) : (
                            <div>Rs {s.previousCommission.toLocaleString()}</div>
                          )}
                        </td>
                        <td>
                          <input 
                            type="checkbox" 
                            checked={s.allowance > 0} 
                            onChange={async (e) => {
                              const checked = e.target.checked;
                              const diff = checked ? 5000 : (s.allowance > 0 ? -s.allowance : 0);
                              
                              // Optimistic update
                              const newData = [...data];
                              const mIdx = newData.findIndex(m => m.month === monthData.month);
                              if (mIdx !== -1) {
                                const sIdx = newData[mIdx].salaries.findIndex((user: any) => user.userId === s.userId);
                                if (sIdx !== -1) {
                                  newData[mIdx].salaries[sIdx].allowance = checked ? 5000 : 0;
                                  newData[mIdx].salaries[sIdx].total += diff;
                                }
                              }
                              setData(newData);

                              // Server update
                              await toggleAllowance(s.userId, monthData.month, checked);
                              
                              // Silent refresh
                              getMonthlySalaries().then(res => setData(res));
                            }} 
                          />
                          Rs {s.allowance.toLocaleString()}
                        </td>
                        <td style={{ fontWeight: 'bold' }}>Rs {s.total.toLocaleString()}</td>
                        <td style={{ fontSize: '0.85rem' }}>
                          {(s.breakdown.length > 0 || (s.previousBreakdownWithRs && s.previousBreakdownWithRs.length > 0)) ? (
                            <details>
                              <summary style={{ cursor: 'pointer', color: 'var(--primary)' }}>View ({s.breakdown.length + (s.previousBreakdownWithRs?.length || 0)})</summary>
                              <ul style={{ paddingLeft: '1rem', marginTop: '0.5rem', listStyle: 'disc' }}>
                                {s.breakdown.map((b: any, i: number) => (
                                  <li key={i}>
                                    <strong>{b.teamName} ({b.role})</strong>: Rs {b.amount.toLocaleString()} <br/>
                                    <span className="text-secondary">{b.description}</span>
                                  </li>
                                ))}
                                {s.previousBreakdownWithRs && s.previousBreakdownWithRs.map((pb: any, i: number) => (
                                  <li key={\`prev-\${i}\`}>
                                    <strong>Previous Commission ({new Date(pb.month + '-01').toLocaleString('default', { month: 'short', year: 'numeric' })})</strong>: Rs {pb.amountRs.toLocaleString()} <br/>
                                    <span className="text-secondary">Amount Cleared: \${pb.amountUSD.toLocaleString()}</span>
                                  </li>
                                ))}
                              </ul>
                            </details>
                          ) : (
                            <span className="text-secondary">None</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// UI COMPONENTS`;

  const safeEndContent = content.substring(endIndex - 81);
  fs.writeFileSync('src/app/portal/admin/AdminDashboardClient.tsx', startContent + newSalariesTab.replace('// UI COMPONENTS', '') + safeEndContent);
  console.log('Successfully replaced SalariesTab');
} else {
  console.log('Failed to find markers');
}
