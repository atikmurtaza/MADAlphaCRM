'use client'

import { useState } from 'react'
import { updateCompensationProfile } from './actions'

export default function SettingsForm({ users }: { users: any[] }) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<any>({})
  const [isSaving, setIsSaving] = useState(false)

  const handleEdit = (u: any) => {
    setEditingId(u.userId)
    setFormData(u.profile || {
      baseSalaryCap: 25000,
      ratePerUnit: 50,
      commissionRate: 40,
      bonusThreshold1: 1000,
      bonusAmount1: 5000,
      bonusThresholdStep: 1000,
      bonusAmountStep: 10000,
      emCommissionThreshold: 10000,
      emCommissionRate1: 10,
      emCommissionRate2: 5,
      leadershipCommissionRate: 10
    })
  }

  const handleSave = async (userId: string) => {
    setIsSaving(true)
    await updateCompensationProfile(userId, formData)
    setIsSaving(false)
    setEditingId(null)
    window.location.reload() // Quick refresh to show updated data
  }

  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Employee</th>
            <th>Base Cap</th>
            <th>Rate/Unit</th>
            <th>Commission Rate</th>
            <th>Bonus T1 (Amt)</th>
            <th>Bonus Step (Amt)</th>
            <th>EM Threshold (Rate1/Rate2)</th>
            <th>TL Rate</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => {
            const isEditing = editingId === u.userId;
            const p = u.profile || {};
            
            return (
              <tr key={u.userId}>
                <td className="font-bold">{u.name}</td>
                {isEditing ? (
                  <>
                    <td><input type="number" className="input" value={formData.baseSalaryCap} onChange={e => setFormData({...formData, baseSalaryCap: e.target.value})} /></td>
                    <td><input type="number" className="input" value={formData.ratePerUnit} onChange={e => setFormData({...formData, ratePerUnit: e.target.value})} /></td>
                    <td><input type="number" className="input" value={formData.commissionRate} onChange={e => setFormData({...formData, commissionRate: e.target.value})} /></td>
                    <td>
                      <input type="number" className="input" placeholder="Thresh" value={formData.bonusThreshold1} onChange={e => setFormData({...formData, bonusThreshold1: e.target.value})} />
                      <input type="number" className="input" placeholder="Amt" value={formData.bonusAmount1} onChange={e => setFormData({...formData, bonusAmount1: e.target.value})} />
                    </td>
                    <td>
                      <input type="number" className="input" placeholder="Step" value={formData.bonusThresholdStep} onChange={e => setFormData({...formData, bonusThresholdStep: e.target.value})} />
                      <input type="number" className="input" placeholder="Amt" value={formData.bonusAmountStep} onChange={e => setFormData({...formData, bonusAmountStep: e.target.value})} />
                    </td>
                    <td>
                      <input type="number" className="input" placeholder="Threshold" value={formData.emCommissionThreshold} onChange={e => setFormData({...formData, emCommissionThreshold: e.target.value})} />
                      <input type="number" className="input" placeholder="Rate 1" value={formData.emCommissionRate1} onChange={e => setFormData({...formData, emCommissionRate1: e.target.value})} />
                      <input type="number" className="input" placeholder="Rate 2" value={formData.emCommissionRate2} onChange={e => setFormData({...formData, emCommissionRate2: e.target.value})} />
                    </td>
                    <td><input type="number" className="input" placeholder="TL Rate" value={formData.leadershipCommissionRate} onChange={e => setFormData({...formData, leadershipCommissionRate: e.target.value})} /></td>
                    <td>
                      <button className="btn primary" onClick={() => handleSave(u.userId)} disabled={isSaving}>Save</button>
                      <button className="btn" onClick={() => setEditingId(null)} style={{ marginLeft: '0.5rem' }}>Cancel</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{p.baseSalaryCap ? `PKR ${p.baseSalaryCap}` : '-'}</td>
                    <td>{p.ratePerUnit ? `PKR ${p.ratePerUnit}` : '-'}</td>
                    <td>{p.commissionRate ? `PKR ${p.commissionRate}` : '-'}</td>
                    <td>{p.bonusThreshold1 ? `$${p.bonusThreshold1} (PKR ${p.bonusAmount1})` : '-'}</td>
                    <td>{p.bonusThresholdStep ? `$${p.bonusThresholdStep} (PKR ${p.bonusAmountStep})` : '-'}</td>
                    <td>{p.emCommissionThreshold ? `$${p.emCommissionThreshold} (${p.emCommissionRate1}/${p.emCommissionRate2})` : '-'}</td>
                    <td>{p.leadershipCommissionRate ? `PKR ${p.leadershipCommissionRate}` : '-'}</td>
                    <td><button className="btn" onClick={() => handleEdit(u)}>Edit Profile</button></td>
                  </>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
