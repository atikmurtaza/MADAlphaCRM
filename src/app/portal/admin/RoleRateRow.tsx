'use client'

import { useState } from 'react';
import { updateRoleRate } from './actions';

export function RoleRateRow({ assignment, userId }: { assignment: any, userId: string }) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <tr style={{ background: 'var(--surface-sunken)' }}>
        <td colSpan={5} style={{ padding: '1rem' }}>
          <form action={async (fd) => {
            const rate = parseFloat(fd.get('rate') as string) || 0;
            const type = fd.get('type') as string;
            await updateRoleRate(assignment.team.id, userId, assignment.roleCode, rate, type);
            setIsEditing(false);
          }} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '1rem', alignItems: 'end' }}>
            <div style={{ fontWeight: 600 }}>{assignment.team.name} <span className="text-secondary font-normal text-sm">({assignment.role})</span></div>
            <div>
              <label className="text-xs font-bold block mb-1">Rate</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input name="rate" type="number" step="0.01" defaultValue={assignment.rate} className="input" style={{ width: '80px', fontSize: '0.85rem' }} required />
                <span className="text-secondary text-sm">/$1000</span>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold block mb-1">Type</label>
              <select name="type" defaultValue={assignment.type} className="input" style={{ fontSize: '0.85rem' }}>
                <option value="CLEARED">Cleared</option>
                <option value="TARGET">Target</option>
                <option value="CLEARED_TIERED_40_50">Cleared (Tiered 40/50)</option>
                <option value="CLEARED_BONUS_1X_FLOOR">Cleared + 1x Floor Bonus</option>
                <option value="CLEARED_BONUS_2X_FLOOR">Cleared + 2x Floor Bonus</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="btn primary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}>Save</button>
              <button type="button" onClick={() => setIsEditing(false)} className="btn secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}>Cancel</button>
            </div>
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }} className="hover-row">
      <td style={{ padding: '1rem', fontWeight: 600 }}>{assignment.team.name}</td>
      <td style={{ padding: '1rem' }}>{assignment.role}</td>
      <td style={{ padding: '1rem' }}>{assignment.rate} <span className="text-secondary">/$1000</span></td>
      <td style={{ padding: '1rem' }}>
        {assignment.type === 'TARGET' ? 'Target' : 
         assignment.type === 'CLEARED_TIERED_40_50' ? 'Cleared (Tiered)' : 
         assignment.type?.includes('BONUS') ? 'Cleared + Bonus' : 'Cleared'}
      </td>
      <td style={{ padding: '1rem' }}>
        <button onClick={() => setIsEditing(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }} title="Edit Rate">✏️</button>
      </td>
    </tr>
  );
}
