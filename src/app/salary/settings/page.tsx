import { getCompensationProfiles } from './actions'
import SettingsForm from './SettingsForm'
import Link from 'next/link'

export default async function CompensationSettingsPage() {
  const users = await getCompensationProfiles()

  return (
    <div className="container">
      <div className="flex items-center gap-4" style={{ marginBottom: '2rem' }}>
        <Link href="/salary" className="badge" style={{ padding: '0.5rem 1rem' }}>← Back</Link>
        <h1 className="text-2xl font-bold">Compensation Profiles Settings</h1>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <p>Manage the dynamic compensation rules for every employee. Changes made here will create a new effective-dated profile, ensuring past frozen payrolls retain their original calculation rules.</p>
      </div>

      <SettingsForm users={users} />
    </div>
  )
}
