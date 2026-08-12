import * as fs from 'fs';

let content = fs.readFileSync('src/app/portal/admin/AdminDashboardClient.tsx', 'utf8');

const startIndex = content.indexOf('        {activeRoleFilter === \'Team Leaders\' ? (');
const endIndex = content.indexOf('      {/* Right Sidebar: Months (Only visible for Team Leaders) */}');

if (startIndex !== -1 && endIndex !== -1) {
  const startContent = content.substring(0, startIndex);
  const endContent = content.substring(endIndex);

  const newContent = `        {activeRoleFilter === 'Team Leaders' ? (
          <div>
            {data.filter(m => m.month === activeMonth).map((monthData, idx) => {
              const teamLeaders = monthData.salaries.filter((s: any) => 
                s.role === 'Team Leader' || s.role === 'Supervisor' || s.role === 'Assistant Team Leader'
              );

              if (teamLeaders.length === 0) return <div key={idx} className="card" style={{ padding: '2rem', textAlign: 'center' }}>No team leaders found for this month.</div>;

              return (
                <div key={monthData.month}>
                  {teamLeaders.map((tl: any) => (
                    <div key={tl.userId} className="card" style={{ marginBottom: '2rem' }}>
                      <h2 style={{ marginBottom: '1.5rem', borderBottom: '2px solid var(--border-subtle)', paddingBottom: '0.5rem', color: 'var(--primary)' }}>
                        {tl.userName} <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>({tl.role})</span>
                      </h2>
                      
                      <div className="table-wrapper">
                        <table>
                          <thead>
                            <tr>
                              <th>Team Name</th>
                              <th>Role</th>
                              <th>Target</th>
                              <th>Cleared</th>
                              <th>Salary</th>
                              <th>Bonus</th>
                              <th>Previous Clearance</th>
                              <th>Allowance</th>
                              <th>Total Salary</th>
                            </tr>
                          </thead>
                          <tbody>
                            {tl.managerTeams && tl.managerTeams.map((team: any, tIdx: number) => (
                              <tr key={tIdx} className="hover-row">
                                <td style={{ fontWeight: 600 }}>{team.teamName}</td>
                                <td>
                                  <span style={{
                                    padding: '0.2rem 0.5rem',
                                    borderRadius: '12px',
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    backgroundColor: team.role === 'Team Leader' ? 'rgba(99, 102, 241, 0.1)' : 
                                                     team.role === 'Supervisor' ? 'rgba(16, 185, 129, 0.1)' : 
                                                     'rgba(245, 158, 11, 0.1)',
                                    color: team.role === 'Team Leader' ? 'var(--primary)' : 
                                           team.role === 'Supervisor' ? 'var(--success)' : 
                                           'var(--warning)'
                                  }}>
                                    {team.role}
                                  </span>
                                </td>
                                <td>\${team.target.toLocaleString()}</td>
                                <td style={{ color: 'var(--success)' }}>\${team.cleared.toLocaleString()}</td>
                                <td>Rs {team.commission.toLocaleString()}</td>
                                <td>Rs {team.bonus.toLocaleString()}</td>
                                <td>
                                  {team.previousBreakdownWithRs && team.previousBreakdownWithRs.length > 0 ? (
                                    <details style={{ margin: 0 }}>
                                      <summary style={{ cursor: 'pointer', color: 'var(--primary)', fontWeight: 'normal', listStyle: 'none' }} className="hide-marker">
                                        Rs {team.previousCommission.toLocaleString()}
                                      </summary>
                                      <ul style={{ paddingLeft: '0', marginTop: '0.5rem', fontSize: '0.85rem', listStyle: 'none', color: 'var(--text-secondary)', background: 'var(--surface-sunken)', padding: '0.5rem', borderRadius: '4px' }}>
                                        {team.previousBreakdownWithRs.map((pb: any, i: number) => (
                                          <li key={i} style={{ marginBottom: '0.25rem' }}>
                                            <span style={{ fontWeight: 600, color: 'var(--text)' }}>{new Date(pb.month + '-01').toLocaleString('default', { month: 'short', year: 'numeric' })}</span>: \${pb.amountUSD.toLocaleString()} (Rs {pb.amountRs.toLocaleString()})
                                          </li>
                                        ))}
                                      </ul>
                                    </details>
                                  ) : (
                                    <div>Rs {team.previousCommission.toLocaleString()}</div>
                                  )}
                                </td>
                                <td>
                                  {tIdx === 0 ? (
                                    <>
                                      <input 
                                        type="checkbox" 
                                        checked={tl.allowance > 0} 
                                        onChange={async (e) => {
                                          const checked = e.target.checked;
                                          const diff = checked ? 5000 : (tl.allowance > 0 ? -tl.allowance : 0);
                                          
                                          const newData = [...data];
                                          const mIdx = newData.findIndex(m => m.month === monthData.month);
                                          if (mIdx !== -1) {
                                            const sIdx = newData[mIdx].salaries.findIndex((user: any) => user.userId === tl.userId);
                                            if (sIdx !== -1) {
                                              newData[mIdx].salaries[sIdx].allowance = checked ? 5000 : 0;
                                              newData[mIdx].salaries[sIdx].total += diff;
                                            }
                                          }
                                          setData(newData);

                                          await toggleAllowance(tl.userId, monthData.month, checked);
                                          getMonthlySalaries().then(res => setData(res));
                                        }} 
                                      />
                                      Rs {tl.allowance.toLocaleString()}
                                    </>
                                  ) : '-'}
                                </td>
                                <td style={{ fontWeight: 'bold' }}>
                                  Rs {(team.commission + team.bonus + team.previousCommission + (tIdx === 0 ? tl.allowance : 0)).toLocaleString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr style={{ background: 'var(--surface-sunken)', borderTop: '2px solid var(--border-subtle)' }}>
                              <td colSpan={8} style={{ textAlign: 'right', fontWeight: 'bold', padding: '1rem' }}>Grand Total</td>
                              <td style={{ fontWeight: 'bold', padding: '1rem', color: 'var(--primary)', fontSize: '1.1rem' }}>
                                Rs {tl.total.toLocaleString()}
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
        ) : activeRoleFilter === 'Agents' ? (
          <div>
            {data.filter(m => m.month === activeMonth).map((monthData, idx) => {
              const agents = monthData.salaries.filter((s: any) => 
                s.role === 'Employee' && s.teamName !== 'Unassigned'
              );

              if (agents.length === 0) return <div key={idx} className="card" style={{ padding: '2rem', textAlign: 'center' }}>No agents found for this month.</div>;

              // Group agents by teamLeaderName
              const groupedAgents = agents.reduce((acc: any, agent: any) => {
                const tlName = agent.teamLeaderName || 'Unknown Leader';
                if (!acc[tlName]) acc[tlName] = [];
                acc[tlName].push(agent);
                return acc;
              }, {});

              return (
                <div key={monthData.month}>
                  {Object.keys(groupedAgents).map((tlName) => (
                    <div key={tlName} className="card" style={{ marginBottom: '2rem' }}>
                      <h2 style={{ marginBottom: '1.5rem', borderBottom: '2px solid var(--border-subtle)', paddingBottom: '0.5rem', color: 'var(--primary)' }}>
                        Team Leader: {tlName}
                      </h2>
                      
                      <div className="table-wrapper">
                        <table>
                          <thead>
                            <tr>
                              <th>Employee</th>
                              <th>Team</th>
                              <th>Target</th>
                              <th>Cleared</th>
                              <th>Base</th>
                              <th>Bonus</th>
                              <th>Commission</th>
                              <th>Previous Commission</th>
                              <th>Allowance</th>
                              <th>Total Salary</th>
                            </tr>
                          </thead>
                          <tbody>
                            {groupedAgents[tlName].map((s: any) => (
                              <tr key={s.userId} className="hover-row">
                                <td>
                                  <div style={{ fontWeight: 600 }}>{s.userName}</div>
                                </td>
                                <td>
                                  <span style={{
                                    padding: '0.2rem 0.5rem',
                                    borderRadius: '12px',
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                    color: 'var(--success)'
                                  }}>
                                    {s.teamName}
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

                                      await toggleAllowance(s.userId, monthData.month, checked);
                                      getMonthlySalaries().then(res => setData(res));
                                    }} 
                                  />
                                  Rs {s.allowance.toLocaleString()}
                                </td>
                                <td style={{ fontWeight: 'bold' }}>Rs {s.total.toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ) : (
          <div>
            {data.filter(m => m.month === activeMonth).map((monthData, idx) => {
              const others = monthData.salaries.filter((s: any) => 
                s.role !== 'Employee' && s.role !== 'Team Leader' && s.role !== 'Supervisor' && s.role !== 'Assistant Team Leader' || (s.role === 'Employee' && s.teamName === 'Unassigned')
              );

              if (others.length === 0) return <div key={idx} className="card" style={{ padding: '2rem', textAlign: 'center' }}>No other employees found for this month.</div>;

              return (
                <div key={monthData.month} className="card" style={{ marginBottom: '2rem' }}>
                  <h2 style={{ marginBottom: '1.5rem', borderBottom: '2px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                    Others
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
                        </tr>
                      </thead>
                      <tbody>
                        {others.map((s: any) => (
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
                                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                                color: 'var(--warning)'
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
                              <div>Rs {s.previousCommission.toLocaleString()}</div>
                            </td>
                            <td>
                              <input 
                                type="checkbox" 
                                checked={s.allowance > 0} 
                                onChange={async (e) => {
                                  const checked = e.target.checked;
                                  const diff = checked ? 5000 : (s.allowance > 0 ? -s.allowance : 0);
                                  
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

                                  await toggleAllowance(s.userId, monthData.month, checked);
                                  getMonthlySalaries().then(res => setData(res));
                                }} 
                              />
                              Rs {s.allowance.toLocaleString()}
                            </td>
                            <td style={{ fontWeight: 'bold' }}>Rs {s.total.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
`;

  fs.writeFileSync('src/app/portal/admin/AdminDashboardClient.tsx', startContent + newContent + endContent.replace('{/* Right Sidebar: Months (Only visible for Team Leaders) */}', '{/* Right Sidebar: Months */}').replace("{activeRoleFilter === 'Team Leaders' && (", "{true && ("));
  console.log('Successfully updated Agents layout');
} else {
  console.log('Could not find markers');
}
