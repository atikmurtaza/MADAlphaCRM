"use client";

import { useState } from "react";
import { assignProfile, updateUserRoles } from "../actions";

type AuthUser = {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  createdAt: string;
  status: string;
  linkedProfileId: string | null;
  position: string;
  roles: string[];
  teamId: string | null;
  departmentId: string | null;
  leadsTeams: string[];
  accessibleEmployees: string[];
};

type CRMProfile = {
  id: string;
  name: string;
  email: string;
  position: string;
  employeeId: string | null;
  team: { id: string; name: string } | null;
  department: { id: string; name: string } | null;
};

type Team = { id: string; name: string };
type Department = { id: string; name: string };
type EmployeeInfo = { id: string; name: string; position: string };

export default function AssignProfileClient({
  authUsers,
  unassignedProfiles,
  teams,
  departments,
  employees
}: {
  authUsers: AuthUser[];
  unassignedProfiles: CRMProfile[];
  teams: Team[];
  departments: Department[];
  employees: EmployeeInfo[];
}) {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<string>("");
  const [managingRolesUser, setManagingRolesUser] = useState<string | null>(null);
  const [editPosition, setEditPosition] = useState("");
  const [editRoles, setEditRoles] = useState<string[]>([]);
  const [editTeamId, setEditTeamId] = useState<string>("");
  const [editDepartmentId, setEditDepartmentId] = useState<string>("");
  const [editLeadsTeams, setEditLeadsTeams] = useState<string[]>([]);
  const [editAccessibleEmployees, setEditAccessibleEmployees] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const AVAILABLE_ROLES = ["Admin", "SuperAdmin", "Employee", "Team Leader", "Execution Manager", "Assistant Execution Manager", "Operations Manager", "Designer"];

  const handleManageRoles = (user: AuthUser) => {
    setManagingRolesUser(user.id);
    setEditPosition(user.position || "Employee");
    setEditRoles(user.roles || []);
    setEditTeamId(user.teamId || "");
    setEditDepartmentId(user.departmentId || "");
    setEditLeadsTeams(user.leadsTeams || []);
    setEditAccessibleEmployees(user.accessibleEmployees || []);
  };

  const handleToggleRole = (role: string) => {
    setEditRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);
  };

  const handleToggleLeadTeam = (teamId: string) => {
    setEditLeadsTeams(prev => prev.includes(teamId) ? prev.filter(id => id !== teamId) : [...prev, teamId]);
  };

  const handleToggleAccessibleEmployee = (empId: string) => {
    setEditAccessibleEmployees(prev => prev.includes(empId) ? prev.filter(id => id !== empId) : [...prev, empId]);
  };

  const handleSaveRoles = async (crmProfileId: string) => {
    setLoading(true);
    setError("");
    const res = await updateUserRoles(
      crmProfileId, 
      editPosition, 
      editRoles, 
      editTeamId, 
      editDepartmentId, 
      editLeadsTeams,
      editAccessibleEmployees
    );
    if (res.error) {
      setError(res.error);
    } else {
      setManagingRolesUser(null);
    }
    setLoading(false);
  };

  const handleAssign = async (authUserId: string) => {
    if (!selectedProfile) {
      setError("Please select a CRM profile.");
      return;
    }

    setLoading(true);
    setError("");

    const res = await assignProfile(authUserId, selectedProfile);

    if (res.error) {
      setError(res.error);
    } else {
      setSelectedUser(null);
      setSelectedProfile("");
    }
    
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {error && (
        <div style={{ padding: '1rem', background: 'rgba(229, 72, 77, 0.1)', border: '1px solid rgba(229, 72, 77, 0.2)', borderRadius: 'var(--radius-md)', color: 'var(--accent-danger)' }}>
          {error}
        </div>
      )}

      {authUsers.map((user) => {
        const isPending = user.status === "Pending Assignment";
        const isSelecting = selectedUser === user.id;
        const isManagingRoles = managingRolesUser === user.id;

        return (
          <div key={user.id} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <h2 style={{ fontSize: '1.25rem', margin: 0 }}>{user.name}</h2>
                  <span style={{ 
                    padding: '0.25rem 0.75rem', 
                    fontSize: '0.75rem', 
                    fontWeight: 600, 
                    borderRadius: 'var(--radius-pill)', 
                    border: '1px solid',
                    background: user.status === "Active" ? 'rgba(15, 157, 88, 0.1)' : user.status === "Pending Assignment" ? 'rgba(245, 158, 11, 0.1)' : 'rgba(229, 72, 77, 0.1)',
                    borderColor: user.status === "Active" ? 'rgba(15, 157, 88, 0.2)' : user.status === "Pending Assignment" ? 'rgba(245, 158, 11, 0.2)' : 'rgba(229, 72, 77, 0.2)',
                    color: user.status === "Active" ? 'var(--accent-success)' : user.status === "Pending Assignment" ? 'var(--accent-warning)' : 'var(--accent-danger)'
                  }}>
                    {user.status}
                  </span>
                  {!user.emailVerified && (
                    <span style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', fontWeight: 600, background: 'rgba(229, 72, 77, 0.1)', color: 'var(--accent-danger)', border: '1px solid rgba(229, 72, 77, 0.2)', borderRadius: 'var(--radius-pill)' }}>
                      Unverified Email
                    </span>
                  )}
                </div>
                <p className="text-secondary" style={{ marginBottom: '0.25rem' }}>{user.email}</p>
                <p className="text-muted" style={{ fontSize: '0.85rem' }}>Joined: {new Date(user.createdAt).toLocaleDateString()}</p>
                {!isPending && (
                  <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-primary)', background: 'rgba(12, 160, 91, 0.1)', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                      Primary: {user.position}
                    </span>
                    {user.roles.map(r => (
                      <span key={r} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                        + {r}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ width: '100%', maxWidth: isSelecting || isManagingRoles ? '100%' : 'auto', flex: 1, display: 'flex', justifyContent: 'flex-end', flexDirection: 'column', alignItems: 'flex-end' }}>
                {isPending && !isSelecting && (
                  <button
                    onClick={() => setSelectedUser(user.id)}
                    className="btn secondary"
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    Assign Profile
                  </button>
                )}

                {!isPending && !isManagingRoles && user.linkedProfileId && (
                  <button
                    onClick={() => handleManageRoles(user)}
                    className="btn secondary"
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    Manage Roles
                  </button>
                )}

                {isManagingRoles && user.linkedProfileId && (
                  <div style={{ width: '100%', background: 'var(--bg-hover)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginTop: '1rem' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Manage Roles for {user.name}</h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                      <div>
                        <label className="text-secondary" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Primary Role / Job Title</label>
                        <select
                          value={editPosition}
                          onChange={(e) => setEditPosition(e.target.value)}
                          style={{ width: '100%', maxWidth: '300px', padding: '0.65rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', color: 'var(--text-primary)', outline: 'none' }}
                        >
                          {AVAILABLE_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>

                      <div>
                        <label className="text-secondary" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Additional Access</label>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          {AVAILABLE_ROLES.filter(r => r !== editPosition).map(role => (
                            <button
                              key={role}
                              onClick={() => handleToggleRole(role)}
                              style={{
                                padding: '0.35rem 0.75rem',
                                fontSize: '0.85rem',
                                borderRadius: 'var(--radius-pill)',
                                border: editRoles.includes(role) ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                                background: editRoles.includes(role) ? 'var(--accent-primary)' : 'var(--bg-card)',
                                color: editRoles.includes(role) ? 'white' : 'var(--text-secondary)',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                              }}
                            >
                              {role}
                            </button>
                          ))}
                        </div>
                      </div>

                      {(editPosition === "Employee" || editRoles.includes("Employee")) && (
                        <div style={{ marginTop: '0.5rem', padding: '1rem', background: 'var(--bg-main)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
                          <label className="text-secondary" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Employee Scope: Which employee portals can they view?</label>
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', maxHeight: '150px', overflowY: 'auto', padding: '0.5rem', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-card)' }}>
                            {employees.filter(e => e.id !== user.linkedProfileId).map(emp => (
                              <button
                                key={emp.id}
                                onClick={() => handleToggleAccessibleEmployee(emp.id)}
                                style={{
                                  padding: '0.25rem 0.6rem',
                                  fontSize: '0.8rem',
                                  borderRadius: 'var(--radius-pill)',
                                  border: editAccessibleEmployees.includes(emp.id) ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                                  background: editAccessibleEmployees.includes(emp.id) ? 'var(--accent-primary)' : 'var(--bg-main)',
                                  color: editAccessibleEmployees.includes(emp.id) ? 'white' : 'var(--text-secondary)',
                                  cursor: 'pointer',
                                }}
                              >
                                {emp.name} ({emp.position})
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {(editPosition === "Team Leader" || editRoles.includes("Team Leader")) && (
                        <div style={{ marginTop: '0.5rem', padding: '1rem', background: 'var(--bg-main)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
                          <label className="text-secondary" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Team Leader Scope: Which teams do they lead?</label>
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {teams.map(team => (
                              <button
                                key={team.id}
                                onClick={() => handleToggleLeadTeam(team.id)}
                                style={{
                                  padding: '0.35rem 0.75rem',
                                  fontSize: '0.85rem',
                                  borderRadius: 'var(--radius-pill)',
                                  border: editLeadsTeams.includes(team.id) ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                                  background: editLeadsTeams.includes(team.id) ? 'var(--accent-primary)' : 'var(--bg-card)',
                                  color: editLeadsTeams.includes(team.id) ? 'white' : 'var(--text-secondary)',
                                  cursor: 'pointer',
                                }}
                              >
                                {team.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {(editPosition === "Execution Manager" || editRoles.includes("Execution Manager")) && (
                        <div style={{ marginTop: '0.5rem', padding: '1rem', background: 'var(--bg-main)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
                          <label className="text-secondary" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Execution Manager Scope: Which department do they manage?</label>
                          <select
                            value={editDepartmentId}
                            onChange={(e) => setEditDepartmentId(e.target.value)}
                            style={{ width: '100%', maxWidth: '300px', padding: '0.65rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', color: 'var(--text-primary)', outline: 'none' }}
                          >
                            <option value="">-- Select Department --</option>
                            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                          </select>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button onClick={() => handleSaveRoles(user.linkedProfileId!)} disabled={loading} className="btn primary">
                        {loading ? "Saving..." : "Save Roles"}
                      </button>
                      <button onClick={() => setManagingRolesUser(null)} disabled={loading} className="btn secondary">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {isSelecting && (
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap', justifyContent: 'flex-end', width: '100%' }}>
                    <div style={{ flex: '1 1 auto', minWidth: '200px', maxWidth: '300px' }}>
                      <label className="text-secondary" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Select CRM Profile</label>
                      <select
                        value={selectedProfile}
                        onChange={(e) => setSelectedProfile(e.target.value)}
                        style={{ width: '100%', padding: '0.65rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', background: 'var(--bg-main)', color: 'var(--text-primary)', outline: 'none' }}
                      >
                        <option value="">-- Select Profile --</option>
                        {unassignedProfiles.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.position}) - {p.team?.name || "No Team"}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={() => handleAssign(user.id)}
                      disabled={loading}
                      className="btn primary"
                    >
                      {loading ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={() => { setSelectedUser(null); setSelectedProfile(""); }}
                      disabled={loading}
                      className="btn secondary"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {authUsers.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          No authenticated users found.
        </div>
      )}
    </div>
  );
}
