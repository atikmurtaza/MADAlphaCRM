import { getPayrollPreview } from './actions'
import PayrollRunner from './PayrollRunner'
import Link from 'next/link'

export default async function RunPayrollPage({ searchParams }: { searchParams: { month?: string } }) {
  const currentMonth = new Date().toISOString().slice(0, 7) // e.g. "2026-07"
  const targetMonth = searchParams.month || currentMonth

  const previewData = await getPayrollPreview(targetMonth)

  return (
    <div className="container">
      <div className="flex items-center gap-4" style={{ marginBottom: '2rem' }}>
        <Link href="/salary" className="badge" style={{ padding: '0.5rem 1rem' }}>← Back</Link>
        <h1 className="text-2xl font-bold">Run Payroll</h1>
      </div>

      <div className="card">
        <p>This engine processes live Targets and Cleared amounts from the CRM for the selected Source Month, applies the Compensation Profiles (Tiered Bonuses, Commission Rates, Caps), and calculates the True-Up Ledger Entries for any late payments or refunds.</p>
        <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <label className="font-bold">Source Month:</label>
          <input 
            type="month" 
            className="input" 
            defaultValue={targetMonth} 
            disabled 
          />
        </div>
      </div>

      <PayrollRunner initialData={previewData} monthStr={targetMonth} />
    </div>
  )
}
