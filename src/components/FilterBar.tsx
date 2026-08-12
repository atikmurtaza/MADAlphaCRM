import React from 'react';

export type FilterState = {
  date: string;
  customId: string;
  client: string;
  product: string;
  target?: string;
  cleared?: string;
  balance?: string;
  status: string;
};

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (key: keyof FilterState, value: string) => void;
  showFinancials?: boolean;
}

export function FilterBar({ filters, onFilterChange, showFinancials = false }: FilterBarProps) {
  return (
    <div className="card" style={{ marginBottom: '1.5rem', padding: '0.75rem 1rem' }}>
      <h3 style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>Global Search / Filters</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.5rem' }}>
        <div>
          <label className="text-xs font-bold block mb-1">Date</label>
          <input className="input" placeholder="e.g. 7/15/2026" value={filters.date} onChange={e => onFilterChange('date', e.target.value)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', height: '28px' }} />
        </div>
        <div>
          <label className="text-xs font-bold block mb-1">Custom ID</label>
          <input className="input" placeholder="INV-..." value={filters.customId} onChange={e => onFilterChange('customId', e.target.value)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', height: '28px' }} />
        </div>
        <div>
          <label className="text-xs font-bold block mb-1">Client / Agent</label>
          <input className="input" placeholder="Search..." value={filters.client} onChange={e => onFilterChange('client', e.target.value)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', height: '28px' }} />
        </div>
        <div>
          <label className="text-xs font-bold block mb-1">Product</label>
          <input className="input" placeholder="Search..." value={filters.product} onChange={e => onFilterChange('product', e.target.value)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', height: '28px' }} />
        </div>
        
        {showFinancials && (
          <>
            <div>
              <label className="text-xs font-bold block mb-1">Target</label>
              <input className="input" placeholder="Amount..." value={filters.target || ''} onChange={e => onFilterChange('target', e.target.value)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', height: '28px' }} />
            </div>
            <div>
              <label className="text-xs font-bold block mb-1">Cleared</label>
              <input className="input" placeholder="Amount..." value={filters.cleared || ''} onChange={e => onFilterChange('cleared', e.target.value)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', height: '28px' }} />
            </div>
            <div>
              <label className="text-xs font-bold block mb-1">Balance</label>
              <input className="input" placeholder="Amount..." value={filters.balance || ''} onChange={e => onFilterChange('balance', e.target.value)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', height: '28px' }} />
            </div>
          </>
        )}

        <div>
          <label className="text-xs font-bold block mb-1">Status</label>
          <input className="input" placeholder="COMPLETED..." value={filters.status} onChange={e => onFilterChange('status', e.target.value)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', height: '28px' }} />
        </div>
      </div>
    </div>
  );
}
