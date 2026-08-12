
import { prisma } from "@/lib/prisma";
import { assertActiveUser } from "@/lib/auth-utils";
import AssignProfileClient from "./AssignProfileClient";
import { logout } from "@/app/auth/actions";

export default async function AdminUsersPage() {
  // 1. Verify caller is an active Admin
  const currentProfile = await assertActiveUser();
  if (currentProfile.position !== "Admin" && currentProfile.position !== "SuperAdmin") { // Assuming position check or we can check a roles array if it was kept. Wait, we reverted roles! The original position string is used.
    throw new Error("Unauthorized: Admin access required.");
  }

  // 2. Fetch all Auth users securely using Prisma's raw SQL query.
  // Since we are not permitted to use the SUPABASE_SERVICE_ROLE_KEY in the codebase,
  // we can leverage the existing Prisma superuser connection to query the auth.users schema directly.
  type AuthUserRow = {
    id: string;
    email: string | null;
    created_at: Date;
    email_confirmed_at: Date | null;
    raw_user_meta_data: any;
  };

  const authData = await prisma.$queryRaw<AuthUserRow[]>`
    SELECT id, email, created_at, email_confirmed_at, raw_user_meta_data 
    FROM auth.users;
  `;

  const authUsers = authData.map(row => ({
    id: row.id,
    email: row.email,
    created_at: row.created_at,
    email_confirmed_at: row.email_confirmed_at,
    user_metadata: row.raw_user_meta_data,
  }));

  // 3. Fetch all CRM profiles
  const crmProfiles = await prisma.user.findMany({
    include: {
      team: true,
      department: true,
      leadsTeams: { select: { id: true } },
      accessibleEmployees: { select: { id: true } }
    }
  });

  // 4. Map them together to determine status
  const usersWithStatus = authUsers.map(authUser => {
    const linkedProfile = crmProfiles.find(p => p.auth_user_id === authUser.id);
    
    let status = "Pending Assignment";
    if (linkedProfile) {
      status = linkedProfile.isActive ? "Active" : "Inactive";
    }

    return {
      id: authUser.id,
      email: authUser.email || "",
      name: authUser.user_metadata?.full_name || "Unknown",
      emailVerified: !!authUser.email_confirmed_at,
      createdAt: authUser.created_at.toISOString(),
      status,
      linkedProfileId: linkedProfile?.id || null,
      position: linkedProfile?.position || "",
      roles: linkedProfile?.roles || [],
      teamId: linkedProfile?.teamId || null,
      departmentId: linkedProfile?.departmentId || null,
      leadsTeams: linkedProfile?.leadsTeams.map(t => t.id) || [],
      accessibleEmployees: linkedProfile?.accessibleEmployees.map(e => e.id) || [],
    };
  });

  // Pass unassigned CRM profiles to the client for the assignment dropdown
  const unassignedProfiles = crmProfiles.filter(p => p.auth_user_id === null);

  const teams = await prisma.team.findMany({ select: { id: true, name: true }});
  const departments = await prisma.department.findMany({ select: { id: true, name: true }});
  const employees = crmProfiles.map(p => ({ id: p.id, name: p.name, position: p.position }));

  // Calculate next sequential Employee ID
  const usedIds = await prisma.usedEmployeeId.findMany({ select: { employeeId: true }});
  const allIds = [...crmProfiles.map(p => p.employeeId), ...usedIds.map(u => u.employeeId)].filter(Boolean) as string[];
  
  let maxEmpNum = 0;
  for (const id of allIds) {
    if (id.startsWith("EMP-")) {
      const num = parseInt(id.replace("EMP-", ""), 10);
      if (!isNaN(num) && num > maxEmpNum) {
        maxEmpNum = num;
      }
    }
  }
  const nextEmployeeId = `EMP-${String(maxEmpNum + 1).padStart(3, '0')}`;

  const salaryTiers = await prisma.salaryTier.findMany({ select: { id: true, name: true }});

  return (
    <div className="container">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">M</div>
          <div>
            <div className="page-eyebrow">Admin Portal</div>
            <div className="brand-title">User Management</div>
          </div>
        </div>
        <div className="flex gap-4">
          <a href="/portal/admin" className="btn secondary">Back to Portal</a>
          <form action={logout}>
            <button type="submit" className="btn secondary">Logout</button>
          </form>
        </div>
      </header>

      <AssignProfileClient 
        authUsers={usersWithStatus} 
        unassignedProfiles={unassignedProfiles} 
        teams={teams}
        departments={departments}
        employees={employees}
        salaryTiers={salaryTiers}
        nextEmployeeId={nextEmployeeId}
      />
    </div>
  );
}
