'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { approveSale, deleteSale, updateSaleStatus, updateSaleLatestUpdate, createTeamMember, tlCreateSale, toggleUserStatus } from './actions';
import { FilterBar, FilterState } from '../../../../components/FilterBar';
import { SalesTable, SaleWithDetails } from '../../../../components/SalesTable';

interface LeaderDashboardClientProps {
  team: any;
  sales: SaleWithDetails[];
}

export default function LeaderDashboardClient({ team, sales }: LeaderDashboardClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'SALES' | 'MEMBERS' | 'LOG_SALE'>('SALES');
  const [showAddMember, setShowAddMember] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showInactive, setShowInactive] = useState(false);

  const [filters, setFilters] = useState<FilterState>({
    date: '', customId: '', client: '', product: '', status: ''
  });

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value.toLowerCase() }));
  };

  const pendingSales = useMemo(() => sales.filter(s => s.approvalStatus === 'PENDING'), [sales]);
  const approvedSales = useMemo(() => sales.filter(s => s.approvalStatus === 'APPROVED'), [sales]);

  const sortedMonths = useMemo(() => {
    const grouped = approvedSales.reduce((acc: Record<string, SaleWithDetails[]>, sale) => {
      const monthStr = new Date(sale.createdAt).toLocaleString('default', { month: 'long', year: 'numeric' });
      if (!acc[monthStr]) acc[monthStr] = [];
      acc[monthStr].push(sale);
      return acc;
    }, {});
    
    return Object.keys(grouped).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()).map(monthStr => ({
      monthStr,
      rawMonthSales: grouped[monthStr]
    }));
  }, [approvedSales]);

  const filteredMonths = useMemo(() => {
    return sortedMonths.map(({ monthStr, rawMonthSales }) => {
      let sumTotal = 0;
      let sumCleared = 0;

      const monthSales = rawMonthSales.filter(sale => {
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
        }
        
        return match;
      });
      
      return { 
        monthStr, 
        monthSales,
        sumTotal,
        sumCleared,
        sumBalance: sumTotal - sumCleared
      };
    }).filter(m => m.monthSales.length > 0);
  }, [sortedMonths, filters]);

  const handleSaleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await tlCreateSale(formData, team.id);
    e.currentTarget.reset();
    alert('Sale Logged successfully!');
    router.refresh();
  };

  return (
    <div>
      <div className="tab-bar">
        <button className={`tab ${activeTab === 'SALES' ? 'active' : ''}`} onClick={() => setActiveTab('SALES')}>Sales & Approvals</button>
        <button className={`tab ${activeTab === 'LOG_SALE' ? 'active' : ''}`} onClick={() => setActiveTab('LOG_SALE')}>+ Log New Sale</button>
        <button className={`tab ${activeTab === 'MEMBERS' ? 'active' : ''}`} onClick={() => setActiveTab('MEMBERS')}>Team Members</button>
      </div>

      {activeTab === 'LOG_SALE' && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3>Log New Sale for Team</h3>
          <form onSubmit={handleSaleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
            <div>
              <label className="text-xs font-bold block mb-1">Select Employee</label>
              <select name="agentId" className="input" required>
                {team.members.map((m: any) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div><label className="text-xs font-bold block mb-1">Client Name</label><input name="clientName" className="input" required /></div>
            <div><label className="text-xs font-bold block mb-1">Client Social Handle</label><input name="clientSocialHandle" className="input" /></div>
            <div><label className="text-xs font-bold block mb-1">Product</label><input name="product" className="input" required /></div>
            <div><label className="text-xs font-bold block mb-1">Product Description</label><input name="productDescription" className="input" /></div>
            <div><label className="text-xs font-bold block mb-1">Target Amount ($)</label><input name="targetAmount" type="number" step="0.01" className="input" required /></div>
            <div><label className="text-xs font-bold block mb-1">Advance Cleared ($)</label><input name="advanceAmount" type="number" step="0.01" defaultValue="0" className="input" required /></div>
            <div><label className="text-xs font-bold block mb-1">Payment Method</label><input name="paymentMethod" className="input" placeholder="Stripe, Wire, etc." /></div>
            <div>
              <label className="text-xs font-bold block mb-1">Status</label>
              <select name="status" className="input" required>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="COMPLETED">COMPLETED</option>
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}><button type="submit" className="btn primary">Submit Sale</button></div>
          </form>
        </div>
      )}

      {activeTab === 'SALES' && (
        <div>
          {pendingSales.length > 0 && (
            <div className="card" style={{ marginBottom: '2rem', border: '1px solid #ff9800' }}>
              <h3 style={{ color: '#ff9800', marginBottom: '1rem' }}>Pending Approvals ({pendingSales.length})</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ fontSize: '0.8rem', width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '0.5rem', textAlign: 'left' }}>Agent</th>
                      <th style={{ padding: '0.5rem', textAlign: 'left' }}>Client</th>
                      <th style={{ padding: '0.5rem', textAlign: 'left' }}>Target</th>
                      <th style={{ padding: '0.5rem', textAlign: 'left' }}>Product</th>
                      <th style={{ padding: '0.5rem', textAlign: 'left' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingSales.map(sale => (
                      <tr key={sale.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '0.5rem' }}>{sale.agent?.name}</td>
                        <td style={{ padding: '0.5rem' }}>{sale.client?.name}</td>
                        <td style={{ padding: '0.5rem' }}>${sale.targetAmount}</td>
                        <td style={{ padding: '0.5rem' }}>{sale.product}</td>
                        <td style={{ padding: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                          <button className="btn primary" style={{ padding: '4px 8px', fontSize: '0.7rem' }} onClick={() => approveSale(sale.id, team.id)}>Approve</button>
                          <button className="btn secondary" style={{ padding: '4px 8px', fontSize: '0.7rem', color: 'red' }} onClick={() => deleteSale(sale.id, team.id)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button className={`btn ${showFilters ? 'primary' : 'secondary'}`} onClick={() => setShowFilters(!showFilters)}>
              {showFilters ? 'Hide Filters ▲' : 'Show Filters ▼'}
            </button>
          </div>

          {showFilters && <FilterBar filters={filters} onFilterChange={handleFilterChange} />}

          <div>
            {filteredMonths.map(m => {
              const clearPercent = m.sumTotal > 0 ? Math.round((m.sumCleared / m.sumTotal) * 100) : 0;
              return (
                <div key={m.monthStr} className="card" style={{ marginBottom: '2rem', padding: 0, overflow: 'hidden' }}>
                  <div className="month-header">
                    <div>
                      <div className="page-eyebrow">Approved Sales</div>
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
                    isLeader={true} 
                    onStatusChange={(saleId, newStatus) => updateSaleStatus(saleId, newStatus, team.id)}
                    onUpdateChange={(saleId, newUpdate) => updateSaleLatestUpdate(saleId, newUpdate, team.id)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'MEMBERS' && (
        <div>
          <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Team Members</h2>
              <p className="text-secondary" style={{ marginTop: '0.25rem' }}>
                Total Active Employees: <strong>{team.members.filter((m: any) => m.isActive).length}</strong>
              </p>
              <button 
                className="btn secondary" 
                style={{ marginTop: '0.5rem', fontSize: '0.75rem', padding: '4px 8px' }}
                onClick={() => setShowInactive(!showInactive)}
              >
                {showInactive ? 'Hide Inactive Members' : 'View Inactive Members'}
              </button>
            </div>
            <button className="btn primary" onClick={() => setShowAddMember(!showAddMember)}>
              {showAddMember ? 'Cancel' : '+ Add New Member'}
            </button>
          </div>

          {showAddMember && (
            <div className="card" style={{ marginBottom: '2rem' }}>
              <h3>Add New Team Member</h3>
              <form action={formData => createTeamMember(formData, team.id).then(() => setShowAddMember(false))} style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
                <div><label className="text-xs font-bold block mb-1">Full Name</label><input name="name" className="input" required /></div>
                <div><label className="text-xs font-bold block mb-1">Email (must be unique)</label><input name="email" type="email" className="input" required /></div>
                <div><label className="text-xs font-bold block mb-1">Position</label><input name="position" defaultValue="Employee" className="input" required /></div>
                <div><label className="text-xs font-bold block mb-1">Base Salary (PKR)</label><input name="baseSalary" type="number" defaultValue="25000" className="input" required /></div>
                <button type="submit" className="btn primary">Create Member</button>
              </form>
            </div>
          )}

          <div className="card">
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>Name</th>
                  <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>Position</th>
                  <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>Status</th>
                  <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {[...team.members, ...(team.formerMembers || []).map((m: any) => ({ ...m, isFormer: true }))]
                  .sort((a: any, b: any) => a.name.localeCompare(b.name))
                  .filter((m: any) => showInactive ? true : (m.isActive && !m.isFormer))
                  .map((member: any) => {
                    const effectivelyActive = member.isActive && !member.isFormer;
                    return (
                  <tr key={member.id} style={{ borderBottom: '1px solid var(--border-subtle)', opacity: effectivelyActive ? 1 : 0.6 }}>
                    <td style={{ padding: '0.75rem' }}>{member.name}</td>
                    <td style={{ padding: '0.75rem' }}>{member.position}</td>
                    <td style={{ padding: '0.75rem' }}>
                      {effectivelyActive ? (
                        <span className="text-success font-bold" style={{ fontSize: '0.75rem' }}>Active</span>
                      ) : (
                        <span className="text-danger font-bold" style={{ fontSize: '0.75rem' }}>Inactive</span>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                      <Link href={`/portal/employee/${member.id}`} className="btn secondary" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>View Dashboard</Link>
                      <button 
                        className="btn" 
                        style={{ padding: '4px 8px', fontSize: '0.75rem', backgroundColor: effectivelyActive ? '#fee2e2' : '#dcfce7', color: effectivelyActive ? 'red' : 'green' }}
                        onClick={() => {
                          if (member.isFormer) {
                            alert('This person is now a member of another team, contact admin for more details.');
                            return;
                          }
                          toggleUserStatus(member.id, member.isActive, team.id);
                        }}
                      >
                        {effectivelyActive ? 'Deactivate' : 'Reactivate'}
                      </button>
                    </td>
                  </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
