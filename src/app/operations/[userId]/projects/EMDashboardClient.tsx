'use client';

import { useState, useMemo } from 'react';
import { updateProjectDetails, assignExecutionManager, createAssistantEM, updateSaleStatus } from './actions';
import { FilterBar, FilterState } from '../../../../components/FilterBar';
import { SalesTable, SaleWithDetails } from '../../../../components/SalesTable';

interface EMDashboardClientProps {
  user: any;
  aems: any[];
  teams: any[];
  sales: (SaleWithDetails & { team?: { id: string; name: string } })[];
}

export default function EMDashboardClient({ user, aems, teams, sales }: EMDashboardClientProps) {
  const isAEM = user.position === 'Assistant Execution Manager';

  // Strict filtering for AEM
  const accessibleSales = useMemo(() => {
    if (!isAEM) return sales; // EM Talha sees all
    return sales.filter(s => {
      const assignedEmId = s.project?.assignments?.[0]?.employee?.id;
      return assignedEmId === user.id;
    });
  }, [sales, isAEM, user.id]);

  // Determine accessible teams
  const accessibleTeams = useMemo(() => {
    if (!isAEM) return teams;
    const teamIdsWithSales = new Set(accessibleSales.map(s => s.team?.id));
    return teams.filter(t => teamIdsWithSales.has(t.id));
  }, [teams, accessibleSales, isAEM]);

  const [activeTab, setActiveTab] = useState<string>('SUMMARY');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    date: '', customId: '', client: '', product: '', status: ''
  });

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value.toLowerCase() }));
  };

  // Build Monthly Breakdown Data
  const monthlyBreakdown = useMemo(() => {
    // Group by month
    const groupedByMonth: Record<string, Record<string, { totalSale: number, totalCleared: number }>> = {};

    accessibleSales.forEach(sale => {
      if (sale.status !== 'COMPLETED' && sale.approvalStatus !== 'APPROVED') return;

      const p = sale.payments?.reduce((acc, val) => acc + val.amount, 0) || 0;
      const r = sale.refunds?.reduce((acc, val) => acc + val.amount, 0) || 0;
      const cleared = Math.max(0, p - r);

      let monthStr = new Date(sale.createdAt).toLocaleString('default', { month: 'long', year: 'numeric' });
      // If we want to strictly use clearance date for EM, we could, but createdAt is what TL uses for now.
      
      if (!groupedByMonth[monthStr]) groupedByMonth[monthStr] = {};
      const teamName = sale.team?.name || 'Unknown Team';
      
      if (!groupedByMonth[monthStr][teamName]) {
        groupedByMonth[monthStr][teamName] = { totalSale: 0, totalCleared: 0 };
      }
      
      groupedByMonth[monthStr][teamName].totalSale += sale.targetAmount;
      groupedByMonth[monthStr][teamName].totalCleared += cleared;
    });

    return groupedByMonth;
  }, [accessibleSales]);

  // Filtered and grouped sales for active team tab
  const filteredMonths = useMemo(() => {
    if (activeTab === 'SUMMARY' || activeTab === 'MANAGEMENT') return [];
    
    const grouped = accessibleSales.reduce((acc: Record<string, typeof accessibleSales>, sale) => {
      if (sale.team?.name !== activeTab) return acc;
      
      const dateStr = new Date(sale.createdAt).toLocaleDateString().toLowerCase();
      const cidStr = (sale.customSaleId || '').toLowerCase();
      const clientAgentStr = `${sale.client?.name || ''} ${sale.agent?.name || ''}`.toLowerCase();
      const prodStr = (sale.product || '').toLowerCase();
      const statStr = (sale.status || '').toLowerCase();

      const match = dateStr.includes(filters.date) &&
             cidStr.includes(filters.customId) &&
             clientAgentStr.includes(filters.client) &&
             prodStr.includes(filters.product) &&
             statStr.includes(filters.status);

      if (match) {
        const monthStr = new Date(sale.createdAt).toLocaleString('default', { month: 'long', year: 'numeric' });
        if (!acc[monthStr]) acc[monthStr] = [];
        acc[monthStr].push(sale);
      }
      return acc;
    }, {});

    return Object.keys(grouped)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .map(monthStr => {
        let sumTotal = 0;
        let sumCleared = 0;
        grouped[monthStr].forEach(sale => {
          const p = sale.payments?.reduce((acc, val) => acc + val.amount, 0) || 0;
          const r = sale.refunds?.reduce((acc, val) => acc + val.amount, 0) || 0;
          const clearedAmt = Math.max(0, p - r);
          sumTotal += sale.targetAmount;
          
          if (sale.status === 'COMPLETED') {
            sumCleared += sale.targetAmount;
          } else if (sale.status === 'REFUNDED') {
            sumCleared -= clearedAmt;
          } else {
            sumCleared += clearedAmt;
          }
        });

        return {
          monthStr,
          monthSales: grouped[monthStr],
          sumTotal,
          sumCleared,
          sumBalance: sumTotal - sumCleared
        };
      });
  }, [accessibleSales, activeTab, filters]);


  const sortedMonths = Object.keys(monthlyBreakdown).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const handleCreateAEM = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    await createAssistantEM(fd, user.id);
    form.reset();
    alert('Assistant EM added successfully.');
  };

  return (
    <div>
      <div className="tab-bar">
        <button
          className={`tab ${activeTab === 'SUMMARY' ? 'active' : ''}`}
          onClick={() => setActiveTab('SUMMARY')}
        >
          Monthly Breakdown
        </button>

        {accessibleTeams.map(t => (
          <button
            key={t.id}
            className={`tab ${activeTab === t.name ? 'active' : ''}`}
            onClick={() => setActiveTab(t.name)}
          >
            {t.name}
          </button>
        ))}

        {!isAEM && (
          <button
            className={`tab ${activeTab === 'MANAGEMENT' ? 'active' : ''}`}
            onClick={() => setActiveTab('MANAGEMENT')}
          >
            Team Management
          </button>
        )}
      </div>

      {activeTab === 'SUMMARY' && (
        <div>
          {sortedMonths.length === 0 ? (
            <p className="text-secondary text-center">No cleared or approved sales data available yet.</p>
          ) : (
            sortedMonths.map(month => (
              <div key={month} className="card" style={{ marginBottom: '2rem', padding: 0, overflow: 'hidden' }}>
                <div className="month-header">
                  <div>
                    <div className="page-eyebrow">Monthly Breakdown</div>
                    <h2 className="month-title">{month}</h2>
                    <div className="month-sub">Click to view salary breakdown (Template)</div>
                  </div>
                </div>
                
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>Team Name</th>
                      <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>Total Sale Amount</th>
                      <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>Total Cleared Amount</th>
                      <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>Remaining Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(monthlyBreakdown[month]).map(([teamName, totals]) => (
                      <tr key={teamName} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '1rem', fontWeight: 'bold' }}>{teamName}</td>
                        <td style={{ padding: '1rem' }}>${totals.totalSale.toLocaleString()}</td>
                        <td style={{ padding: '1rem' }} className="text-success">${totals.totalCleared.toLocaleString()}</td>
                        <td style={{ padding: '1rem', color: (totals.totalSale - totals.totalCleared) > 0 ? 'var(--accent-danger)' : 'var(--text-primary)' }}>
                          ${(totals.totalSale - totals.totalCleared).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab !== 'SUMMARY' && activeTab !== 'MANAGEMENT' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2>{activeTab} Sales</h2>
            <button className={`btn ${showFilters ? 'primary' : 'secondary'}`} onClick={() => setShowFilters(!showFilters)}>
              {showFilters ? 'Hide Filters ▲' : 'Show Filters ▼'}
            </button>
          </div>

          {showFilters && <FilterBar filters={filters} onFilterChange={handleFilterChange} />}

          <div>
            {filteredMonths.map(m => {
              const clearPercent = m.sumTotal > 0 ? Math.round((m.sumCleared / m.sumTotal) * 100) : 0;
              return (
                <div key={m.monthStr} className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: '2rem' }}>
                  <div className="month-header">
                    <div>
                      <div className="page-eyebrow">{activeTab}</div>
                      <h2 className="month-title">{m.monthStr}</h2>
                    </div>
                    <div className="stat-row">
                      <div className="stat-chip">
                        <span className="stat-label"><span className="stat-dot dot-total" />Total Sale</span>
                        <span className="stat-value">${m.sumTotal.toLocaleString()}</span>
                      </div>
                      <div className="stat-chip">
                        <span className="stat-label"><span className="stat-dot dot-cleared" />Cleared · {clearPercent}%</span>
                        <span className="stat-value text-success">${m.sumCleared.toLocaleString()}</span>
                      </div>
                      <div className="stat-chip">
                        <span className="stat-label"><span className="stat-dot dot-balance" />Balance</span>
                        <span className="stat-value text-danger">${m.sumBalance.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <SalesTable 
                    sales={m.monthSales}
                    isExecutionManager={true}
                    aems={aems}
                    onStatusChange={async (saleId, status) => {
                      await updateSaleStatus(saleId, status, user.id);
                    }}
                    onProjectUpdate={async (projectId, field, value) => {
                      await updateProjectDetails(projectId, field, value, user.id);
                    }}
                    onAssignEM={async (projectId, employeeId) => {
                      await assignExecutionManager(projectId, employeeId, user.id);
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'MANAGEMENT' && !isAEM && (
        <div>
          <div className="card" style={{ marginBottom: '2rem' }}>
            <h3>Add Assistant Execution Manager</h3>
            <form onSubmit={handleCreateAEM} style={{ display: 'grid', gap: '1rem', marginTop: '1rem', maxWidth: '400px' }}>
              <div><label className="text-xs font-bold block mb-1">Full Name</label><input name="name" className="input" required /></div>
              <div><label className="text-xs font-bold block mb-1">Email (unique)</label><input name="email" type="email" className="input" required /></div>
              <div><label className="text-xs font-bold block mb-1">Base Salary (PKR)</label><input name="baseSalary" type="number" defaultValue="25000" className="input" required /></div>
              <button type="submit" className="btn primary">Add to Operations</button>
            </form>
          </div>

          <div className="card">
            <h3>Current Assistant EMs</h3>
            {aems.length === 0 ? (
              <p className="text-secondary mt-4">No Assistant Execution Managers configured.</p>
            ) : (
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginTop: '1rem' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>Name</th>
                    <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>Email</th>
                    <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>Base Salary</th>
                  </tr>
                </thead>
                <tbody>
                  {aems.map(a => (
                    <tr key={a.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '0.75rem' }}>{a.name}</td>
                      <td style={{ padding: '0.75rem' }}>{a.email}</td>
                      <td style={{ padding: '0.75rem' }}>{a.baseSalary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
