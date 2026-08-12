'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LeaderLoginForm({ teams }: { teams: any[] }) {
  const router = useRouter();
  const [selectedTeam, setSelectedTeam] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTeam) {
      router.push(`/portal/leader/${selectedTeam}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <label className="text-sm font-bold block mb-1">Select Team</label>
        <select 
          className="input" 
          value={selectedTeam} 
          onChange={e => setSelectedTeam(e.target.value)}
          required
        >
          <option value="">-- Choose Team --</option>
          {teams.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>
      
      <button 
        type="submit" 
        className="btn primary" 
        style={{ marginTop: '1rem' }}
        disabled={!selectedTeam}
      >
        Enter Portal
      </button>
    </form>
  );
}
