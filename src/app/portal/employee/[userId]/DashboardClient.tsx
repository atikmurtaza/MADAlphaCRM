'use client'

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getEmployeeSalaries } from '../../admin/monthly-salaries';
import { createSale } from '../../../sales/new/actions';
import { FilterBar, FilterState } from '../../../../components/FilterBar';
import { SalesTable, SaleWithDetails } from '../../../../components/SalesTable';

interface DashboardClientProps {
  user: any;
  initialSales: SaleWithDetails[];
}

export default function DashboardClient({ user, initialSales }: DashboardClientProps) {
  const router = useRouter();
  const [sales] = useState<SaleWithDetails[]>(initialSales);
  const [activeTab, setActiveTab] = useState<'SALES' | 'LOG_SALE' | 'SALARIES'>('SALES');
  const [showFilters, setShowFilters] = useState(false);
  const [salariesData, setSalariesData] = useState<any[]>([]);
  const [loadingSalaries, setLoadingSalaries] = useState(false);

  const [filters, setFilters] = useState<FilterState>({
    date: '', customId: '', client: '', product: '', target: '', cleared: '', balance: '', status: ''
  });

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value.toLowerCase() }));
  };

  useEffect(() => {
    if (activeTab === 'SALARIES') {
      setLoadingSalaries(true);
      getEmployeeSalaries(user.id).then(res => {
        setSalariesData(res);
        setLoadingSalaries(false);
      });
    }
  }, [activeTab, user.id]);

  const handleSaleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set('agentId', user.id);
    await createSale(formData);
    e.currentTarget.reset();
    alert('Sale submitted successfully! You can submit another one.');
    router.refresh();
  };

  // Memoize grouped and sorted months
  const sortedMonths = useMemo(() => {
    const grouped = sales.reduce((acc: Record<string, SaleWithDetails[]>, sale) => {
      const month = new Date(sale.createdAt).toISOString().slice(0, 7);
      if (!acc[month]) acc[month] = [];
      acc[month].push(sale);
      return acc;
    }, {});
    return Object.keys(grouped).sort().reverse().map(monthStr => ({
      monthStr,
      rawMonthSales: grouped[monthStr]
    }));
  }, [sales]);

  // Memoize filtered sales based on active filters
  const filteredMonths = useMemo(() => {
    return sortedMonths.map(({ monthStr, rawMonthSales }) => {
      const [year, month] = monthStr.split('-');
      const formattedMonth = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
      
      let sumTotal = 0;
      let sumCleared = 0;

      const monthSales = rawMonthSales.filter(s => {
        const dateStr = new Date(s.createdAt).toLocaleDateString().toLowerCase();
        const customId = (s.customSaleId || '').toLowerCase();
        const client = (s.clientSocialHandle || s.client?.name || '').toLowerCase();
        const product = (s.product || '').toLowerCase();
        const target = s.targetAmount.toString();
        
        const p = s.payments?.reduce((acc, val) => acc + val.amount, 0) || 0;
        const r = s.refunds?.reduce((acc, val) => acc + val.amount, 0) || 0;
        const clearedAmt = Math.max(0, p - r);

        const balStr = (s.targetAmount - clearedAmt).toString();
        
        const match = dateStr.includes(filters.date) &&
               customId.includes(filters.customId) &&
               client.includes(filters.client) &&
               product.includes(filters.product) &&
               target.includes(filters.target || '') &&
               clearedAmt.toString().includes(filters.cleared || '') &&
               balStr.includes(filters.balance || '') &&
               s.status.toLowerCase().includes(filters.status);
        
        if (match) {
          sumTotal += s.targetAmount;
          
          if (s.status === 'COMPLETED') {
            sumCleared += s.targetAmount;
          } else if (s.status === 'REFUNDED') {
            sumCleared -= clearedAmt;
          } else {
            sumCleared += clearedAmt;
          }
        }
        return match;
      });

      return {
        monthStr,
        formattedMonth,
        monthSales,
        sumTotal,
        sumCleared,
        sumBalance: sumTotal - sumCleared
      };
    }).filter(m => m.monthSales.length > 0);
  }, [sortedMonths, filters]);

  return (
    <div>
      <style>{`
        details > summary.hide-marker {
          list-style: none;
        }
        details > summary.hide-marker::-webkit-details-marker {
          display: none;
        }
      `}</style>
      <div style={{ marginBottom: '1rem' }}>
        <button className="btn secondary" onClick={() => router.back()}>
          ← Back
        </button>
      </div>
      {/* Tabs */}
      <div className="tab-bar">
        <button
          className={`tab ${activeTab === 'SALES' ? 'active' : ''}`}
          onClick={() => setActiveTab('SALES')}
        >
          Sales & Targets
        </button>
        <button
          className={`tab ${activeTab === 'LOG_SALE' ? 'active' : ''}`}
          onClick={() => setActiveTab('LOG_SALE')}
        >
          + Log New Sale
        </button>
        <button
          className={`tab ${activeTab === 'SALARIES' ? 'active' : ''}`}
          onClick={() => setActiveTab('SALARIES')}
        >
          Salaries
        </button>
      </div>

      {activeTab === 'LOG_SALE' && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1.5rem' }}>Log New Sale</h2>
          <form onSubmit={handleSaleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div><label className="text-sm font-bold block mb-1">Agent Name</label><input className="input" value={user.name} disabled /></div>
              <div><label className="text-sm font-bold block mb-1">Agent ID</label><input className="input" value={user.id} disabled /></div>
              <div><label className="text-sm font-bold block mb-1">Team</label><input className="input" value={user.team?.name || 'Unassigned'} disabled /></div>
              <div><label className="text-sm font-bold block mb-1">Client Name</label><input name="clientName" className="input" required /></div>
              <div><label className="text-sm font-bold block mb-1">Target Amount (USD)</label><input name="targetAmount" type="number" step="0.01" className="input" required /></div>
              <div><label className="text-sm font-bold block mb-1">Advance Amount (USD)</label><input name="advanceAmount" type="number" step="0.01" className="input" required /></div>
              <div><label className="text-sm font-bold block mb-1">Payment Method</label><input name="paymentMethod" className="input" placeholder="e.g. Stripe, Wire" /></div>
              <div><label className="text-sm font-bold block mb-1">Client Social Handle</label><input name="clientSocialHandle" className="input" placeholder="@client" /></div>
              <div><label className="text-sm font-bold block mb-1">Product</label><input name="product" className="input" placeholder="e.g. 3D Model" /></div>
              <div style={{ gridColumn: '1 / -1' }}><label className="text-sm font-bold block mb-1">Product Description</label><textarea name="productDescription" className="input" rows={3}></textarea></div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="text-sm font-bold block mb-1">Status</label>
                <select name="saleStatus" className="input">
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
            </div>
            <button type="submit" className="btn primary" style={{ alignSelf: 'flex-start', marginTop: '1rem' }}>Submit Sale</button>
          </form>
        </div>
      )}

      {activeTab === 'SALES' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button className={`btn ${showFilters ? 'primary' : 'secondary'}`} onClick={() => setShowFilters(!showFilters)}>
              {showFilters ? 'Hide Filters ▲' : 'Show Filters ▼'}
            </button>
          </div>

          {showFilters && <FilterBar filters={filters} onFilterChange={handleFilterChange} showFinancials />}

          <div>
            {filteredMonths.map(m => (
              <div key={m.monthStr} className="card" style={{ marginBottom: '2rem', overflow: 'hidden', padding: 0 }}>
                <div className="month-header">
                  <div>
                    <div className="page-eyebrow">Sales & Targets</div>
                    <h2 className="month-title">{m.formattedMonth}</h2>
                  </div>
                  <div className="stat-row">
                    <div className="stat-chip">
                      <span className="stat-label"><span className="stat-dot dot-total" />Total Sale</span>
                      <span className="stat-value">${m.sumTotal.toLocaleString()}</span>
                    </div>
                    <div className="stat-chip">
                      <span className="stat-label"><span className="stat-dot dot-cleared" />Cleared</span>
                      <span className="stat-value text-success">${m.sumCleared.toLocaleString()}</span>
                    </div>
                    <div className="stat-chip">
                      <span className="stat-label"><span className="stat-dot dot-balance" />Balance</span>
                      <span className="stat-value text-danger">${m.sumBalance.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <SalesTable sales={m.monthSales} isLeader={false} />
              </div>
            ))}
          </div>
        </div>
      )}
      {activeTab === 'SALARIES' && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1.5rem' }}>My Monthly Salaries</h2>
          {loadingSalaries ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>Loading salaries...</div>
          ) : salariesData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No salary data available.</div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Name</th>
                    <th>Team</th>
                    <th>Target</th>
                    <th>Cleared</th>
                    <th>Salary</th>
                    <th>Bonus</th>
                    <th>Commission</th>
                    <th>Previous Commission</th>
                    <th>Allowance</th>
                    <th>Total Salary</th>
                  </tr>
                </thead>
                <tbody>
                  {salariesData.map((data: any) => {
                    const s = data.salary;
                    return (
                      <tr key={data.month} className="hover-row">
                        <td style={{ fontWeight: 600 }}>{new Date(data.month + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}</td>
                        <td>{s.userName}</td>
                        <td>{s.teamName}</td>
                        <td>${s.uPerfTarget.toLocaleString()}</td>
                        <td style={{ color: 'var(--success)' }}>${s.uPerfCleared.toLocaleString()}</td>
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
                                    <span style={{ fontWeight: 600, color: 'var(--text)' }}>{new Date(pb.month + '-01').toLocaleString('default', { month: 'short', year: 'numeric' })}</span>: ${pb.amountUSD.toLocaleString()} (Rs {pb.amountRs.toLocaleString()})
                                  </li>
                                ))}
                              </ul>
                            </details>
                          ) : (
                            <div>Rs {s.previousCommission.toLocaleString()}</div>
                          )}
                        </td>
                        <td>Rs {s.allowance.toLocaleString()}</td>
                        <td style={{ fontWeight: 'bold' }}>Rs {s.total.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
