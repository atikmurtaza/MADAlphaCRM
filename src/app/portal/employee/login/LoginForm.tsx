'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginForm({ teams }: { teams: any[] }) {
  const router = useRouter();
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  
  const selectedTeam = teams.find(t => t.id === selectedTeamId);
  const members = selectedTeam ? selectedTeam.members : [];
  
  // Sort members by name
  const sortedMembers = [...members].sort((a, b) => a.name.localeCompare(b.name));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUserId) {
      router.push(`/portal/employee/${selectedUserId}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <label className="text-sm font-bold block mb-1">Select Team</label>
        <select 
          className="input" 
          value={selectedTeamId} 
          onChange={(e) => {
            setSelectedTeamId(e.target.value);
            setSelectedUserId(''); // reset user
          }}
          required
        >
          <option value="">Choose a team...</option>
          {teams.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-sm font-bold block mb-1">Select Your Name</label>
        <select 
          className="input" 
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
          required
          disabled={!selectedTeamId}
        >
          <option value="">{selectedTeamId ? 'Choose your name...' : 'Select a team first'}</option>
          {sortedMembers.map(m => (
            <option key={m.id} value={m.id}>
              {m.name} ({m.employeeId || 'No ID'})
            </option>
          ))}
        </select>
        {selectedTeamId && (
          <p className="text-secondary text-sm mt-1" style={{ marginTop: '0.5rem' }}>
            Unique ID shown to prevent name conflicts.
          </p>
        )}
      </div>

      <button type="submit" className="btn primary" disabled={!selectedUserId} style={{ marginTop: '1rem', padding: '0.75rem' }}>
        Enter Portal
      </button>
    </form>
  )
}
