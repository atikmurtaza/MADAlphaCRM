import { requireAuth } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import Link from "next/link";
import { logout } from "@/app/auth/actions";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const context = await requireAuth();

  if (context.status === "UNAUTHENTICATED") {
    redirect("/auth/login");
  }

  if (context.status === "PENDING_ASSIGNMENT") {
    redirect("/pending-assignment");
  }

  if (context.status === "INACTIVE") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-center p-8 bg-[#111] border border-neutral-800 rounded-2xl max-w-md">
          <h1 className="text-2xl font-bold text-red-500 mb-2">Account Inactive</h1>
          <p className="text-neutral-400">Your CRM profile has been deactivated. Please contact an administrator.</p>
          <form action={logout}>
            <button type="submit" className="mt-6 px-6 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors">
              Sign Out
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Fetch full profile with relations for scoped routing
  const profile = await prisma.user.findUnique({
    where: { id: context.crmProfile!.id },
    include: {
      team: true,
      leadsTeams: true,
      accessibleEmployees: true,
      department: true
    }
  });

  if (!profile) redirect("/auth/login");

  const availableRoles = Array.from(new Set([profile.position, ...(profile.roles || [])]));
  const userDashboards: { title: string; desc: string; href: string }[] = [];

  // Admin / SuperAdmin
  if (availableRoles.includes("Admin") || availableRoles.includes("SuperAdmin")) {
    userDashboards.push({ title: "Admin Portal", desc: "Manage departments, teams, and employees", href: "/portal/admin" });
  }

  // Execution Manager
  if (availableRoles.includes("Execution Manager") || availableRoles.includes("Assistant Execution Manager")) {
    userDashboards.push({ title: "Operations Hub", desc: "Oversee operations, projects, and delivery", href: `/operations/${profile.id}/projects` });
  }

  // Employee (Self)
  if (profile.teamId) {
    userDashboards.push({ title: "Employee Portal", desc: "Your personal portal", href: `/portal/employee/${profile.id}` });
  }

  // Employee (Delegated Access)
  if (availableRoles.includes("Employee") && profile.accessibleEmployees.length > 0) {
    profile.accessibleEmployees.forEach(emp => {
      userDashboards.push({ 
        title: `Employee Portal: ${emp.name}`, 
        desc: `Access ${emp.name}'s employee dashboard`, 
        href: `/portal/employee/${emp.id}` 
      });
    });
  }

  // Team Leader
  if (availableRoles.includes("Team Leader") && profile.leadsTeams.length > 0) {
    profile.leadsTeams.forEach(team => {
      userDashboards.push({ 
        title: `Sales Dashboard: ${team.name}`, 
        desc: `Manage sales and stats for ${team.name}`, 
        href: `/portal/leader/${team.id}` 
      });
    });
  }

  // If the user only has 1 configured dashboard, immediately redirect them to it
  if (userDashboards.length === 1) {
    redirect(userDashboards[0].href);
  }

  // If the user has multiple roles (e.g. Execution Manager AND Admin), show the selection screen
  return (
    <div className="container" style={{ minHeight: '90vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <div className="brand" style={{ justifyContent: 'center', marginBottom: '1.5rem' }}>
          <div className="brand-mark" style={{ width: '56px', height: '56px', fontSize: '1.5rem', borderRadius: '16px' }}>M</div>
        </div>
        <div className="page-eyebrow" style={{ justifyContent: 'center' }}>Welcome, {profile.name}</div>
        <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.4rem)', marginBottom: '0.75rem', letterSpacing: '-0.04em' }}>
          Select your Workspace
        </h1>
        <p className="text-secondary text-lg">You have access to multiple portals.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', width: '100%', maxWidth: '800px' }}>
        {userDashboards.length > 0 ? (
          userDashboards.map((dashboard, idx) => (
            <Link 
              key={idx}
              href={dashboard.href} 
              className="card" 
              style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textDecoration: 'none', padding: '1.75rem' }}
            >
              <div style={{ width: '52px', height: '52px', borderRadius: '15px', background: 'var(--bg-main)', display: 'grid', placeItems: 'center', fontSize: '1.6rem', boxShadow: '0 8px 20px rgba(15,23,42,0.18)' }}>
                🚀
              </div>
              <div>
                <h2 style={{ fontSize: '1.15rem', marginBottom: '0.35rem' }}>{dashboard.title}</h2>
                <p className="text-secondary text-sm" style={{ lineHeight: 1.45 }}>{dashboard.desc}</p>
              </div>
              <span className="text-primary" style={{ fontSize: '0.8rem', fontWeight: 700, marginTop: 'auto' }}>Enter →</span>
            </Link>
          ))
        ) : (
          <div className="card text-center text-secondary">
            Your profile does not have any active dashboard assignments.
          </div>
        )}
      </div>

      <form action={logout} style={{ marginTop: '3rem' }}>
        <button type="submit" className="btn secondary">
          Sign Out
        </button>
      </form>
    </div>
  );
}
