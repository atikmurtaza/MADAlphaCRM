'use client'

import { useState } from 'react';
import { createSale } from './actions';

export default function NewSaleForm({ agents }: { agents: any[] }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccess(false);
    
    const formData = new FormData(e.currentTarget);
    await createSale(formData);
    
    setIsSubmitting(false);
    setSuccess(true);
    e.currentTarget.reset();
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {success && (
        <div style={{ padding: '1rem', backgroundColor: 'var(--success-bg)', color: 'var(--success-text)', borderRadius: '4px' }}>
          Sale created successfully! The project has been sent to the Operations queue.
        </div>
      )}

      <div>
        <label className="text-sm font-bold block mb-1">Client Name</label>
        <input name="clientName" required className="input w-full" placeholder="e.g. John Doe" />
      </div>

      <div>
        <label className="text-sm font-bold block mb-1">Sales Agent</label>
        <select name="agentId" required className="input w-full">
          <option value="">Select an agent...</option>
          {agents.map(a => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', gap: '1rem' }}>
        <div style={{ flex: 1 }}>
          <label className="text-sm font-bold block mb-1">Target Amount (USD)</label>
          <input name="targetAmount" type="number" step="0.01" min="1" required className="input w-full" placeholder="500" />
        </div>
        <div style={{ flex: 1 }}>
          <label className="text-sm font-bold block mb-1">Advance Cleared (USD)</label>
          <input name="advanceAmount" type="number" step="0.01" min="0" required className="input w-full" placeholder="100" />
        </div>
      </div>

      <div>
        <label className="text-sm font-bold block mb-1">Status</label>
        <select name="saleStatus" className="input w-full">
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="DECLINED">Declined</option>
        </select>
      </div>

      <button type="submit" className="btn primary" disabled={isSubmitting} style={{ marginTop: '1rem' }}>
        {isSubmitting ? 'Creating...' : 'Create Sale & Project'}
      </button>
    </form>
  )
}
