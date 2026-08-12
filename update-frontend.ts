import * as fs from 'fs';

let content = fs.readFileSync('src/app/portal/admin/AdminDashboardClient.tsx', 'utf8');

// 1. Update useState
content = content.replace(
  `useState<'Agents' | 'Team Leaders' | 'Others'>('Agents');`,
  `useState<'Agents' | 'Team Leaders' | 'Execution Managers' | 'Others'>('Agents');`
);

// 2. Add button to sidebar
const sidebarOthersBtn = `<button 
            className={\`role-btn \${activeRoleFilter === 'Others' ? 'active' : ''}\`}
            onClick={() => setActiveRoleFilter('Others')}
          >
            Others
          </button>`;
const sidebarEmBtn = `<button 
            className={\`role-btn \${activeRoleFilter === 'Execution Managers' ? 'active' : ''}\`}
            onClick={() => {
                setActiveRoleFilter('Execution Managers');
                if (!activeMonth && data.length > 0) setActiveMonth(data[0].month);
            }}
          >
            Execution Managers
          </button>
          ` + sidebarOthersBtn;
content = content.replace(sidebarOthersBtn, sidebarEmBtn);

// 3. Add EM View
const emView = `        ) : activeRoleFilter === 'Execution Managers' ? (
          <div>
            {data.filter(m => m.month === activeMonth).map((monthData, idx) => {
              const execManagers = monthData.salaries.filter((s: any) => 
                s.role === 'Execution Manager' || s.role === 'Assistant Execution Manager'
              );

              if (execManagers.length === 0) return <div key={idx} className="card" style={{ padding: '2rem', textAlign: 'center' }}>No execution managers found for this month.</div>;

              return (
                <div key={monthData.month}>
                  {execManagers.map((em: any) => (
                    <div key={em.userId} className="card" style={{ marginBottom: '2rem' }}>
                      <h2 style={{ marginBottom: '1.5rem', borderBottom: '2px solid var(--border-subtle)', paddingBottom: '0.5rem', color: 'var(--primary)' }}>
                        {em.userName} <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>({em.role})</span>
                      </h2>
                      
                      <div className="table-wrapper">
                        <table>
                          <thead>
                            <tr>
                              <th>Team Name</th>
                              <th>Role</th>
                              <th>Total Target</th>
                              <th>Total Cleared</th>
                              <th>Cleared in {new Date(monthData.month + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {em.emTeams && em.emTeams.map((team: any, tIdx: number) => (
                              <tr key={tIdx} className="hover-row">
                                <td style={{ fontWeight: 600 }}>{team.teamName}</td>
                                <td>
                                  <span style={{
                                    padding: '0.2rem 0.5rem',
                                    borderRadius: '12px',
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                                    color: 'var(--primary)'
                                  }}>
                                    {team.role}
                                  </span>
                                </td>
                                <td>\${team.target.toLocaleString()}</td>
                                <td style={{ color: 'var(--success)' }}>\${(team.cleared + team.previousCleared).toLocaleString()}</td>
                                <td>
                                  {team.previousBreakdown && team.previousBreakdown.length > 0 ? (
                                    <details style={{ margin: 0 }}>
                                      <summary style={{ cursor: 'pointer', color: 'var(--primary)', fontWeight: 'normal', listStyle: 'none' }} className="hide-marker">
                                        \${team.previousCleared.toLocaleString()}
                                      </summary>
                                      <ul style={{ paddingLeft: '0', marginTop: '0.5rem', fontSize: '0.85rem', listStyle: 'none', color: 'var(--text-secondary)', background: 'var(--surface-sunken)', padding: '0.5rem', borderRadius: '4px' }}>
                                        {team.previousBreakdown.map((pb: any, i: number) => (
                                          <li key={i} style={{ marginBottom: '0.25rem' }}>
                                            <span style={{ fontWeight: 600, color: 'var(--text)' }}>{new Date(pb.month + '-01').toLocaleString('default', { month: 'short', year: 'numeric' })}</span>: \${pb.amount.toLocaleString()}
                                          </li>
                                        ))}
                                      </ul>
                                    </details>
                                  ) : (
                                    <div>\${team.previousCleared.toLocaleString()}</div>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr style={{ background: 'var(--surface-sunken)', borderTop: '2px solid var(--border-subtle)' }}>
                              <td colSpan={2} style={{ textAlign: 'right', fontWeight: 'bold', padding: '1rem' }}>Grand Total (for Salary Calc)</td>
                              <td style={{ fontWeight: 'bold', padding: '1rem' }}>\${em.emTeams?.reduce((sum: number, t: any) => sum + t.target, 0).toLocaleString() || 0}</td>
                              <td style={{ fontWeight: 'bold', padding: '1rem', color: 'var(--success)' }}>
                                \${em.emTeams?.reduce((sum: number, t: any) => sum + t.cleared + t.previousCleared, 0).toLocaleString() || 0}
                              </td>
                              <td></td>
                            </tr>
                            <tr style={{ background: 'var(--surface-sunken)' }}>
                              <td colSpan={4} style={{ textAlign: 'right', fontWeight: 'bold', padding: '1rem' }}>Allowance</td>
                              <td style={{ fontWeight: 'bold', padding: '1rem' }}>
                                <input 
                                  type="checkbox" 
                                  checked={em.allowance > 0} 
                                  onChange={async (e) => {
                                    const checked = e.target.checked;
                                    const diff = checked ? 5000 : (em.allowance > 0 ? -em.allowance : 0);
                                    
                                    const newData = [...data];
                                    const mIdx = newData.findIndex(m => m.month === monthData.month);
                                    if (mIdx !== -1) {
                                      const sIdx = newData[mIdx].salaries.findIndex((user: any) => user.userId === em.userId);
                                      if (sIdx !== -1) {
                                        newData[mIdx].salaries[sIdx].allowance = checked ? 5000 : 0;
                                        newData[mIdx].salaries[sIdx].total += diff;
                                      }
                                    }
                                    setData(newData);

                                    await toggleAllowance(em.userId, monthData.month, checked);
                                    getMonthlySalaries().then(res => setData(res));
                                  }} 
                                />
                                Rs {em.allowance.toLocaleString()}
                              </td>
                            </tr>
                            <tr style={{ background: 'var(--surface-sunken)', borderTop: '2px solid var(--border-subtle)' }}>
                              <td colSpan={4} style={{ textAlign: 'right', fontWeight: 'bold', padding: '1rem' }}>Total Salary Payable</td>
                              <td style={{ fontWeight: 'bold', padding: '1rem', color: 'var(--primary)', fontSize: '1.1rem' }}>
                                Rs {em.total.toLocaleString()}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
`;

content = content.replace(`        ) : activeRoleFilter === 'Agents' ? (`, emView + `        ) : activeRoleFilter === 'Agents' ? (`);

// 4. Update 'Others' filter to exclude Execution Managers
const othersFilterOriginal = `const others = monthData.salaries.filter((s: any) => 
                s.role !== 'Employee' && s.role !== 'Team Leader' && s.role !== 'Supervisor' && s.role !== 'Assistant Team Leader' || (s.role === 'Employee' && s.teamName === 'Unassigned')
              );`;
const othersFilterNew = `const others = monthData.salaries.filter((s: any) => 
                s.role !== 'Execution Manager' && s.role !== 'Assistant Execution Manager' && s.role !== 'Employee' && s.role !== 'Team Leader' && s.role !== 'Supervisor' && s.role !== 'Assistant Team Leader' || (s.role === 'Employee' && s.teamName === 'Unassigned')
              );`;
content = content.replace(othersFilterOriginal, othersFilterNew);

fs.writeFileSync('src/app/portal/admin/AdminDashboardClient.tsx', content);
