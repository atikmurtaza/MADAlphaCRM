import Link from 'next/link';

const portals = [
  { href: '/portal/employee/login', icon: '👩‍💻', title: 'Employee', desc: 'Log your sales and view your commissions.', tint: 'linear-gradient(135deg,#635BFF,#8B5CF6)' },
  { href: '/portal/leader/login', icon: '📈', title: 'Team Leader', desc: 'Manage your team and approve sales.', tint: 'linear-gradient(135deg,#12B8A6,#0EA5E9)' },
  { href: '/operations/login', icon: '⚙️', title: 'Execution Manager', desc: 'Manage projects and assign designers.', tint: 'linear-gradient(135deg,#F59E0B,#F45B9B)' },
  { href: '/portal/admin', icon: '🛡️', title: 'Admin', desc: 'Manage departments, teams, and employees.', tint: 'linear-gradient(135deg,#0F172A,#635BFF)' },
];

export default function Home() {
  return (
    <div className="container" style={{ minHeight: '90vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <div className="brand" style={{ justifyContent: 'center', marginBottom: '1.5rem' }}>
          <div className="brand-mark" style={{ width: '56px', height: '56px', fontSize: '1.5rem', borderRadius: '16px' }}>M</div>
        </div>
        <div className="page-eyebrow" style={{ justifyContent: 'center' }}>MAD Alpha · Workforce Suite</div>
        <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.4rem)', marginBottom: '0.75rem', letterSpacing: '-0.04em' }}>
          Welcome to your Workspace
        </h1>
        <p className="text-secondary text-lg">Select your portal to continue.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '1.5rem', width: '100%', maxWidth: '760px' }}>
        {portals.map(p => (
          <Link key={p.href} href={p.href} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textDecoration: 'none', padding: '1.75rem' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '15px', background: p.tint, display: 'grid', placeItems: 'center', fontSize: '1.6rem', boxShadow: '0 8px 20px rgba(15,23,42,0.18)' }}>
              {p.icon}
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', marginBottom: '0.35rem' }}>{p.title}</h2>
              <p className="text-secondary text-sm" style={{ lineHeight: 1.45 }}>{p.desc}</p>
            </div>
            <span className="text-primary" style={{ fontSize: '0.8rem', fontWeight: 700, marginTop: 'auto' }}>Enter →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
