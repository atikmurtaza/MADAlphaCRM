'use client'

import { useState } from 'react'
import { lockPayrollMonth } from './actions'
import { useRouter } from 'next/navigation'

export default function PayrollRunner({ initialData, monthStr }: { initialData: any[], monthStr: string }) {
  const router = useRouter()
  const [allowances, setAllowances] = useState<Record<string, boolean>>({})
  const [isLocking, setIsLocking] = useState(false)

  const toggleAllowance = (userId: string) => {
    setAllowances(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }))
  }

  const handleLock = async () => {
    if (!confirm(`Are you sure you want to lock payroll for ${monthStr}? This will freeze snapshots and generate commission ledgers.`)) return;
    
    setIsLocking(true)
    await lockPayrollMonth(monthStr, allowances)
    alert("Payroll Locked Successfully!")
    router.push('/salary')
  }

  return (
    <div style={{ marginTop: '2rem' }}>
      <div className="flex justify-between items-center" style={{ marginBottom: '1rem' }}>
        <h2 className="text-xl font-bold">Employees Preview ({monthStr})</h2>
        <button 
          className="btn primary" 
          onClick={handleLock}
          disabled={isLocking}
        >
          {isLocking ? 'Locking...' : 'Lock Month & Generate Ledgers'}
        </button>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Target / Cleared</th>
              <th>Base Salary</th>
              <th>Bonus</th>
              <th>Agent Commission</th>
              <th>EM Commission</th>
              <th>TL Commission</th>
              <th>Attendance Allowance (5k)</th>
              <th>Gross Total</th>
            </tr>
          </thead>
          <tbody>
            {initialData.map((row) => {
              const u = row.user;
              const p = row.payroll;
              const hasAllowance = allowances[u.id] || false;
              const finalGross = p.grossTotal + (hasAllowance ? 5000 : 0);

              return (
                <tr key={u.id}>
                  <td className="font-bold">{u.name}</td>
                  <td>
                    <div className="text-sm">T: ${p.target.toLocaleString()}</div>
                    <div className="text-sm text-success">C: ${p.cleared.toLocaleString()}</div>
                  </td>
                  <td>PKR {p.calculatedSalary.toLocaleString()}</td>
                  <td>PKR {p.calculatedBonus.toLocaleString()}</td>
                  <td>
                    PKR {p.incrementalCommission.toLocaleString()}
                    {p.previouslyPaidCommission > 0 && (
                      <div className="text-sm text-secondary">(Total: {p.totalCommissionEarned})</div>
                    )}
                  </td>
                  <td>
                    PKR {p.incrementalEM.toLocaleString()}
                    {p.previouslyPaidEM > 0 && (
                      <div className="text-sm text-secondary">(Total: {p.totalEMEarned})</div>
                    )}
                  </td>
                  <td>
                    PKR {p.incrementalLeadership.toLocaleString()}
                    {p.previouslyPaidLeadership > 0 && (
                      <div className="text-sm text-secondary">(Total: {p.totalLeadershipEarned})</div>
                    )}
                  </td>
                  <td>
                    <input 
                      type="checkbox" 
                      checked={hasAllowance}
                      onChange={() => toggleAllowance(u.id)}
                      style={{ transform: 'scale(1.5)', marginLeft: '1rem' }}
                    />
                  </td>
                  <td className="font-bold">PKR {finalGross.toLocaleString()}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
