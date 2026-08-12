'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { addDepartment, addTeam, addEmployee, updateEmployee, updateTeam, assignEmployeeToTier, assignTeamRoles, updateRoleRate, toggleAllowance } from './actions';
import { getMonthlySalaries } from './monthly-salaries';
import { RoleRateRow } from './RoleRateRow';

export default function AdminDashboardClient({ departments, unassignedEmployees, totalEmployees, salaryTiers }: { departments: any[], unassignedEmployees: any[], totalEmployees: number, salaryTiers: any[] }) {
  const [activeTab, setActiveTab] = useState<'summary' | 'employees' | 'departments' | 'salaries' | 'salary_structure'>('summary');
  
  // Extract all teams from departments
  const allTeams = departments.flatMap(d => d.teams);
  
  return (
    <div>
      <div className="tabs" style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '2rem' }}>
        <button className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`} onClick={() => setActiveTab('summary')} style={{ padding: '0.75rem 1rem', background: 'none', border: 'none', borderBottom: activeTab === 'summary' ? '2px solid var(--primary)' : '2px solid transparent', cursor: 'pointer', fontWeight: 600, color: activeTab === 'summary' ? 'var(--primary)' : 'var(--text-secondary)' }}>Summary</button>
        <button className={`tab-btn ${activeTab === 'employees' ? 'active' : ''}`} onClick={() => setActiveTab('employees')} style={{ padding: '0.75rem 1rem', background: 'none', border: 'none', borderBottom: activeTab === 'employees' ? '2px solid var(--primary)' : '2px solid transparent', cursor: 'pointer', fontWeight: 600, color: activeTab === 'employees' ? 'var(--primary)' : 'var(--text-secondary)' }}>Employees</button>
        <button className={`tab-btn ${activeTab === 'departments' ? 'active' : ''}`} onClick={() => setActiveTab('departments')} style={{ padding: '0.75rem 1rem', background: 'none', border: 'none', borderBottom: activeTab === 'departments' ? '2px solid var(--primary)' : '2px solid transparent', cursor: 'pointer', fontWeight: 600, color: activeTab === 'departments' ? 'var(--primary)' : 'var(--text-secondary)' }}>Departments</button>
        <button className={`tab-btn ${activeTab === 'salaries' ? 'active' : ''}`} onClick={() => setActiveTab('salaries')} style={{ padding: '0.75rem 1rem', background: 'none', border: 'none', borderBottom: activeTab === 'salaries' ? '2px solid var(--primary)' : '2px solid transparent', cursor: 'pointer', fontWeight: 600, color: activeTab === 'salaries' ? 'var(--primary)' : 'var(--text-secondary)' }}>Salaries</button>
        <button className={`tab-btn ${activeTab === 'salary_structure' ? 'active' : ''}`} onClick={() => setActiveTab('salary_structure')} style={{ padding: '0.75rem 1rem', background: 'none', border: 'none', borderBottom: activeTab === 'salary_structure' ? '2px solid var(--primary)' : '2px solid transparent', cursor: 'pointer', fontWeight: 600, color: activeTab === 'salary_structure' ? 'var(--primary)' : 'var(--text-secondary)' }}>Salary Structure</button>
      </div>

      {activeTab === 'summary' && <SummaryTab teams={allTeams} departments={departments} />}
      {activeTab === 'employees' && <EmployeesTab departments={departments} allTeams={allTeams} unassignedEmployees={unassignedEmployees} totalEmployees={totalEmployees} />}
      {activeTab === 'departments' && <DepartmentsTab departments={departments} />}
      {activeTab === 'salaries' && <SalariesTab />}
      {activeTab === 'salary_structure' && <SalaryStructureTab salaryTiers={salaryTiers} departments={departments} unassignedEmployees={unassignedEmployees} />}
    </div>
  );
}

// -----------------------------------------------------------------------------
// SUMMARY TAB
// -----------------------------------------------------------------------------
function SummaryTab({ teams, departments }: { teams: any[], departments: any[] }) {
  // 1. Group sales by month
  const monthlyData: Record<string, {
    totalSales: number;
    totalCleared: number;
    teams: Record<string, {
      team: any;
      deptName: string;
      sales: number;
      cleared: number;
    }>
  }> = {};

  departments.forEach(dept => {
    dept.teams.forEach((team: any) => {
      team.sales.forEach((s: any) => {
        const date = new Date(s.createdAt);
        const monthStr = date.toLocaleString('default', { month: 'long', year: 'numeric' });
        
        if (!monthlyData[monthStr]) {
          monthlyData[monthStr] = { totalSales: 0, totalCleared: 0, teams: {} };
        }
        if (!monthlyData[monthStr].teams[team.id]) {
          monthlyData[monthStr].teams[team.id] = { team, deptName: dept.name, sales: 0, cleared: 0 };
        }

        const saleAmount = s.targetAmount;
        let clearedAmount = 0;
        
        if (s.status === 'COMPLETED') {
          clearedAmount = saleAmount;
        } else if (s.status === 'IN_PROGRESS' || s.status === 'DECLINED' || !s.status) {
          clearedAmount = (s.payments || []).reduce((sum: number, p: any) => sum + p.amount, 0);
        }

        monthlyData[monthStr].totalSales += saleAmount;
        monthlyData[monthStr].totalCleared += clearedAmount;
        monthlyData[monthStr].teams[team.id].sales += saleAmount;
        monthlyData[monthStr].teams[team.id].cleared += clearedAmount;
      });
    });
  });

  // Sort months descending
  const sortedMonths = Object.keys(monthlyData).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  if (sortedMonths.length === 0) {
    return <div className="card text-center text-secondary">No sales data available.</div>;
  }

  return (
    <div>
      {sortedMonths.map(month => {
        const data = monthlyData[month];
        const tBalance = data.totalSales - data.totalCleared;
        const tPct = data.totalSales > 0 ? ((data.totalCleared / data.totalSales) * 100).toFixed(1) : '0.0';

        return (
          <div key={month} className="card" style={{ marginBottom: '2rem', padding: 0, overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg, #0F172A, #1E293B)', color: 'white', padding: '1.5rem 2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <div className="page-eyebrow" style={{ color: '#94A3B8' }}>Monthly Summary</div>
                  <h2 style={{ fontSize: '1.5rem', margin: 0 }}>{month}</h2>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', color: '#94A3B8', marginBottom: '0.25rem' }}>Total Sales Amount</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>${data.totalSales.toLocaleString()}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', color: '#94A3B8', marginBottom: '0.25rem' }}>Total Cleared</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#34D399' }}>${data.totalCleared.toLocaleString()}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', color: '#94A3B8', marginBottom: '0.25rem' }}>Remaining Balance</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#F87171' }}>${tBalance.toLocaleString()}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', color: '#94A3B8', marginBottom: '0.25rem' }}>Clearance %</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#60A5FA' }}>{tPct}%</div>
                </div>
              </div>
            </div>

            {/* Table */}
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>Team Name</th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>Department</th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>Team Leader</th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>Total Sales</th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>Cleared</th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>Balance</th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>Clearance %</th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(data.teams)
                  .sort((a, b) => b.sales - a.sales)
                  .map(({ team, deptName, sales, cleared }) => {
                  const balance = sales - cleared;
                  const pct = sales > 0 ? ((cleared / sales) * 100).toFixed(1) : '0.0';
                  
                  return (
                    <tr key={team.id} style={{ borderBottom: '1px solid var(--border-subtle)' }} className="hover-row">
                      <td style={{ padding: '1rem', fontWeight: 600 }}>{team.name}</td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ fontSize: '0.75rem', padding: '2px 8px', background: 'var(--surface-sunken)', borderRadius: '12px' }}>{deptName}</span>
                      </td>
                      <td style={{ padding: '1rem' }}>{team.leader?.name || 'Unassigned'}</td>
                      <td style={{ padding: '1rem' }}>${sales.toLocaleString()}</td>
                      <td style={{ padding: '1rem', color: 'var(--success)' }}>${cleared.toLocaleString()}</td>
                      <td style={{ padding: '1rem' }}>${balance.toLocaleString()}</td>
                      <td style={{ padding: '1rem', fontWeight: 600 }}>{pct}%</td>
                      <td style={{ padding: '1rem' }}>
                        <Link href={`/portal/leader/${team.id}`} className="btn secondary" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>View Portal</Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}

// -----------------------------------------------------------------------------
// EMPLOYEES TAB
// -----------------------------------------------------------------------------
function EmployeesTab({ departments, allTeams, unassignedEmployees, totalEmployees }: { departments: any[], allTeams: any[], unassignedEmployees: any[], totalEmployees: number }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

      const allEmployeesList = [
        ...departments.flatMap(d => d.teams.flatMap((t: any) => t.members)),
        ...unassignedEmployees
      ];
      // Deduplicate by ID
      const uniqueEmployees = Array.from(new Map(allEmployeesList.map(e => [e.id, e])).values());
      const allTeamLeaders = uniqueEmployees.filter(e => e.position === 'Team Leader');

      return (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <div className="card" style={{ background: 'linear-gradient(135deg, var(--primary), #4338ca)', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <h3 style={{ marginBottom: '0.5rem', color: 'rgba(255,255,255,0.8)', fontSize: '1rem' }}>Company Total</h3>
              <div style={{ fontSize: '2.5rem', fontWeight: 800 }}>{totalEmployees}</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>Active Employees</div>
            </div>
            
            {departments.map(dept => {
              const activeEmployees = dept.teams.reduce((acc: number, t: any) => acc + t.members.filter((m: any) => m.isActive).length, 0);
              const totalDeptEmployees = dept.teams.reduce((acc: number, t: any) => acc + t.members.length, 0);
              return (
                <div key={dept.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <h4 style={{ marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '1rem' }}>{dept.name}</h4>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{activeEmployees} Active</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem', fontWeight: 500 }}>
                    {dept.teams.length} Teams · {totalDeptEmployees} Total
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>Team Rosters</h3>
            <button onClick={() => setShowAddForm(!showAddForm)} className="btn primary">
              {showAddForm ? 'Close' : 'Add Employee'}
            </button>
          </div>

          {showAddForm && (
            <div className="card" style={{ marginBottom: '2rem', border: '2px solid var(--primary)' }}>
              <h3>Add New Employee</h3>
              <form action={async (fd) => { await addEmployee(fd); setShowAddForm(false); }} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                <div><label className="text-xs font-bold block mb-1">Full Name</label><input name="name" className="input" required /></div>
                <div><label className="text-xs font-bold block mb-1">Email (must be unique)</label><input name="email" type="email" className="input" required /></div>
                <div>
                  <label className="text-xs font-bold block mb-1">Team</label>
                  <select name="teamId" className="input" required>
                    {allTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div><label className="text-xs font-bold block mb-1">Position</label><input name="position" defaultValue="Employee" className="input" required /></div>
                <div><label className="text-xs font-bold block mb-1">Base Salary (PKR)</label><input name="baseSalary" type="number" defaultValue="25000" className="input" required /></div>
                <div style={{ gridColumn: '1 / -1' }}><button type="submit" className="btn primary">Save Employee</button></div>
              </form>
            </div>
          )}

          <TeamLeadersCard teamLeaders={allTeamLeaders} allTeams={allTeams} allDepartments={departments} />

      <div style={{ display: 'grid', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Operations Teams First */}
        {departments.filter(d => d.name === 'Operations').flatMap(dept => dept.teams.map((team: any) => (
          <TeamRosterCard key={team.id} team={team} deptName={dept.name} allTeams={allTeams} allDepartments={departments} />
        )))}
        
        {/* Then Sales/Other Teams */}
        {departments.filter(d => d.name !== 'Operations').flatMap(dept => dept.teams.map((team: any) => (
          <TeamRosterCard key={team.id} team={team} deptName={dept.name} allTeams={allTeams} allDepartments={departments} />
        )))}
      </div>

      <UnassignedEmployeesCard unassignedEmployees={unassignedEmployees.filter(e => e.position !== 'Team Leader')} allTeams={allTeams} allDepartments={departments} />
    </div>
  );
}

function TeamRosterCard({ team, deptName, allTeams, allDepartments }: { team: any, deptName: string, allTeams: any[], allDepartments: any[] }) {
  const [showInactive, setShowInactive] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const activeCount = team.members.filter((m: any) => m.isActive).length;
  
  // Sorting: leader first, then alphabetical
  const sortedMembers = [...team.members].sort((a: any, b: any) => {
    if (a.id === team.leaderId) return -1;
    if (b.id === team.leaderId) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isCollapsed ? 0 : '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h3 style={{ margin: 0 }}>{team.name}</h3>
            <span style={{ fontSize: '0.7rem', padding: '2px 6px', background: 'var(--surface-sunken)', borderRadius: '8px' }}>{deptName}</span>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            {activeCount} Active Members · Total {team.members.length}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {!isCollapsed && (
            <button onClick={() => setShowInactive(!showInactive)} className="btn secondary" style={{ fontSize: '0.8rem', padding: '4px 10px' }}>
              {showInactive ? 'Hide Inactive' : 'View Inactive Members'}
            </button>
          )}
          <button onClick={() => setIsCollapsed(!isCollapsed)} className="btn secondary" style={{ fontSize: '1rem', padding: '0 8px', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isCollapsed ? '+' : '-'}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr>
              <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>Name</th>
              <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>ID</th>
              <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>Department</th>
              <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>Position</th>
              <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>Team</th>
              <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>Status</th>
              <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-subtle)', width: '40px' }}></th>
            </tr>
          </thead>
          <tbody>
            {sortedMembers.filter(m => showInactive || m.isActive).map((member: any) => (
              <EmployeeRow key={member.id} member={member} isLeader={member.id === team.leaderId} allTeams={allTeams} allDepartments={allDepartments} />
            ))}
            {sortedMembers.filter(m => showInactive || m.isActive).length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-secondary)' }}>No members found.</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

function TeamLeadersCard({ teamLeaders, allTeams, allDepartments }: { teamLeaders: any[], allTeams: any[], allDepartments: any[] }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const activeCount = teamLeaders.filter(m => m.isActive).length;

  if (teamLeaders.length === 0) return null;

  return (
    <div className="card" style={{ marginBottom: '2rem', border: '2px solid var(--primary)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isCollapsed ? 0 : '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h3 style={{ margin: 0 }}>Team Leaders</h3>
            <span style={{ fontSize: '0.7rem', padding: '2px 6px', background: 'var(--primary)', color: 'white', borderRadius: '8px' }}>Executive</span>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            {activeCount} Active Members · Total {teamLeaders.length}
          </div>
        </div>
        <button onClick={() => setIsCollapsed(!isCollapsed)} className="btn secondary" style={{ fontSize: '1rem', padding: '0 8px', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isCollapsed ? '+' : '-'}
        </button>
      </div>
      
      {!isCollapsed && (
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr>
              <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>Name</th>
              <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>ID</th>
              <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>Department</th>
              <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>Position</th>
              <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>Leads Teams</th>
              <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>Status</th>
              <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-subtle)', width: '40px' }}></th>
            </tr>
          </thead>
          <tbody>
            {teamLeaders.map((member: any) => (
              <EmployeeRow key={member.id} member={member} isLeader={true} allTeams={allTeams} allDepartments={allDepartments} showLeadsTeams={true} />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function UnassignedEmployeesCard({ unassignedEmployees, allTeams, allDepartments }: { unassignedEmployees: any[], allTeams: any[], allDepartments: any[] }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const activeCount = unassignedEmployees.filter(m => m.isActive).length;

  if (unassignedEmployees.length === 0) return null;

  return (
    <div className="card" style={{ border: '2px dashed var(--border-subtle)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isCollapsed ? 0 : '1rem' }}>
        <div>
          <h3 style={{ margin: 0 }}>Unassigned Employees</h3>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            {activeCount} Active Members · Total {unassignedEmployees.length}
          </div>
        </div>
        <button onClick={() => setIsCollapsed(!isCollapsed)} className="btn secondary" style={{ fontSize: '1rem', padding: '0 8px', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isCollapsed ? '+' : '-'}
        </button>
      </div>
      
      {!isCollapsed && (
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr>
              <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>Name</th>
              <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>ID</th>
              <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>Department</th>
              <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>Position</th>
              <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>Team</th>
              <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>Status</th>
              <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-subtle)', width: '40px' }}></th>
            </tr>
          </thead>
          <tbody>
            {unassignedEmployees.map((member: any) => (
              <EmployeeRow key={member.id} member={member} isLeader={false} allTeams={allTeams} allDepartments={allDepartments} />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function EmployeeRow({ member, isLeader, allTeams, allDepartments, showLeadsTeams = false }: { member: any, isLeader: boolean, allTeams: any[], allDepartments: any[], showLeadsTeams?: boolean }) {
  const [isEditing, setIsEditing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const memberDeptId = member.departmentId || allTeams.find(t => t.id === member.teamId)?.departmentId || '';
  const [selectedDeptId, setSelectedDeptId] = useState(memberDeptId);
  const [selectedPosition, setSelectedPosition] = useState(member.position);

  const deptName = allDepartments.find(d => d.id === selectedDeptId)?.name || '';

  const roleOptions = deptName === 'Sales' 
    ? ['Employee', 'Assistant Team Leader', 'Team Leader']
    : deptName === 'Operations'
    ? ['Execution Manager', 'Assistant Execution Manager', 'Assistant Project Manager', 'Designer']
    : ['HR Manager', 'Assistant HR Manager', 'Unassigned', 'Employee', 'Team Leader'];

  // Filter teams based on selected department
  const filteredTeams = allTeams.filter(t => t.departmentId === selectedDeptId);

  if (isEditing) {
    return (
      <tr style={{ background: 'var(--surface-sunken)' }}>
        <td colSpan={7} style={{ padding: '0.5rem' }}>
          <form action={async (fd) => { 
            const res = await updateEmployee(member.id, fd); 
            if (res && !res.success) {
              setErrorMsg(res.message || 'Error updating employee');
            } else {
              setIsEditing(false); 
              setErrorMsg('');
            }
          }} style={{ display: 'grid', gridTemplateColumns: 'minmax(100px, 1fr) minmax(60px, 1fr) minmax(100px, 1fr) minmax(100px, 1fr) minmax(100px, 1fr) minmax(120px, 1fr) auto', gap: '0.5rem', alignItems: 'center' }}>
            <input name="name" defaultValue={member.name} className="input" style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem' }} required title="Name" />
            <input name="employeeId" defaultValue={member.employeeId || ''} placeholder="ID" className="input" style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem' }} title="Employee ID" />
            <select name="departmentId" value={selectedDeptId} onChange={(e) => setSelectedDeptId(e.target.value)} className="input" style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem' }} required title="Department">
              <option value="" disabled>Select Dept</option>
              {allDepartments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <select name="position" value={selectedPosition} onChange={(e) => setSelectedPosition(e.target.value)} className="input" style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem' }} title="Position">
              {roleOptions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <select name="teamId" defaultValue={member.teamId || ''} className="input" style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem' }} title="Member Of Team">
              <option value="">No Team</option>
              {filteredTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            
            {selectedPosition === 'Team Leader' ? (
              <MultiSelectDropdown 
                options={filteredTeams} 
                selectedIds={member.leadsTeams?.map((t:any) => t.id) || []} 
                name="leadsTeams" 
              />
            ) : <div />}

            <div style={{ display: 'flex', gap: '0.25rem' }}>
              <button type="submit" className="btn primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>Save</button>
              <button type="button" onClick={() => { setIsEditing(false); setErrorMsg(''); setSelectedDeptId(memberDeptId); setSelectedPosition(member.position); }} className="btn secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>Cancel</button>
            </div>
          </form>
          {errorMsg && <div className="text-danger" style={{ fontSize: '0.8rem', marginTop: '0.5rem', fontWeight: 600 }}>{errorMsg}</div>}
        </td>
      </tr>
    );
  }

  const teamDisplay = showLeadsTeams && member.leadsTeams?.length > 0
    ? member.leadsTeams.map((t: any) => t.name).join(', ')
    : member.team?.name || allTeams.find(t => t.id === member.teamId)?.name || <span style={{ color: 'var(--text-secondary)' }}>No Team</span>;

  const displayDeptName = allDepartments.find(d => d.id === memberDeptId)?.name || '-';

  return (
    <tr style={{ borderBottom: '1px solid var(--border-subtle)', opacity: member.isActive ? 1 : 0.5 }} className="hover-row">
      <td style={{ padding: '0.75rem', fontWeight: 600 }}>
        {member.name}
        {isLeader && <span style={{ marginLeft: '0.5rem', fontSize: '0.65rem', padding: '1px 6px', background: 'var(--primary)', color: 'white', borderRadius: '12px' }}>Leader</span>}
      </td>
      <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>{member.employeeId || '-'}</td>
      <td style={{ padding: '0.75rem' }}>{displayDeptName}</td>
      <td style={{ padding: '0.75rem' }}>{member.position}</td>
      <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>{teamDisplay}</td>
      <td style={{ padding: '0.75rem' }}>
        {member.isActive ? <span className="text-success" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Active</span> : <span className="text-danger" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Inactive</span>}
      </td>
      <td style={{ padding: '0.75rem' }}>
        <button onClick={() => setIsEditing(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }} title="Edit Employee">✏️</button>
      </td>
    </tr>
  );
}

// -----------------------------------------------------------------------------
// DEPARTMENTS TAB
// -----------------------------------------------------------------------------
function DepartmentsTab({ departments }: { departments: any[] }) {
  return (
    <div>
      <div className="card" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0 }}>Add New Team</h3>
          <p className="text-secondary text-sm">Create a team and assign it to a department.</p>
        </div>
        <form action={addTeam} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
          <div>
            <label className="text-xs font-bold block mb-1">Department</label>
            <select name="departmentId" className="input" style={{ width: '150px' }} required>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold block mb-1">Team Name</label>
            <input name="name" className="input" placeholder="e.g. Team Alpha" required />
          </div>
          <button type="submit" className="btn primary">Create</button>
        </form>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {departments.map(dept => {
          const deptTeamLeaders = dept.users.filter((u: any) => u.position === 'Team Leader' && u.isActive);
          
          return (
            <div key={dept.id} className="card">
              <h3 style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                {dept.name} Department
              </h3>
              
              {dept.teams.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-subtle)' }}>Team</th>
                        <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-subtle)' }}>Team Leader</th>
                        <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-subtle)' }}>Supervisor(s)</th>
                        <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-subtle)' }}>Assistant Team Leader(s)</th>
                        <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-subtle)', width: '80px' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dept.teams.map((t: any) => (
                        <TeamRolesRow key={t.id} team={t} deptTeamLeaders={deptTeamLeaders} />
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No teams yet.</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}



function TeamRolesRow({ team, deptTeamLeaders }: { team: any, deptTeamLeaders: any[] }) {
  const [isEditing, setIsEditing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (isEditing) {
    const assistantOptions = [...deptTeamLeaders];
    team.members.forEach((m: any) => {
      if (!assistantOptions.find(o => o.id === m.id)) {
        assistantOptions.push(m);
      }
    });

    return (
      <tr style={{ background: 'var(--surface-sunken)' }}>
        <td colSpan={5} style={{ padding: '1rem' }}>
          <form action={async (fd) => {
            // First update the team name
            await updateTeam(team.id, fd);
            
            // Then update the roles
            const leaderId = fd.get('leaderId') as string;
            const supervisorIds = fd.getAll('supervisorIds') as string[];
            const assistantIds = fd.getAll('assistantIds') as string[];
            
            await assignTeamRoles(team.id, leaderId === 'null' ? null : leaderId, supervisorIds, assistantIds);
            
            setIsEditing(false);
          }} style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', alignItems: 'end' }}>
            <div>
              <label className="text-xs font-bold block mb-1">Team Name</label>
              <input name="name" defaultValue={team.name} className="input" style={{ width: '100%', fontSize: '0.85rem' }} required />
            </div>
            <div>
              <label className="text-xs font-bold block mb-1">Team Leader</label>
              <select name="leaderId" defaultValue={team.leaderId || 'null'} className="input" style={{ width: '100%', fontSize: '0.85rem' }}>
                <option value="null">None</option>
                {deptTeamLeaders.map(tl => <option key={tl.id} value={tl.id}>{tl.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold block mb-1">Supervisor(s)</label>
              <MultiSelectDropdown options={deptTeamLeaders} selectedIds={team.supervisors?.map((s: any) => s.user.id) || []} name="supervisorIds" />
            </div>
            <div>
              <label className="text-xs font-bold block mb-1">Assistant TL(s)</label>
              <MultiSelectDropdown options={assistantOptions} selectedIds={team.assistantLeaders?.map((a: any) => a.user.id) || []} name="assistantIds" />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="btn primary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}>Save</button>
              <button type="button" onClick={() => setIsEditing(false)} className="btn secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}>Cancel</button>
            </div>
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }} className="hover-row">
      <td style={{ padding: '1rem' }}>
        <div style={{ fontWeight: 600 }}>{team.name}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{team.members.length} members</div>
      </td>
      <td style={{ padding: '1rem' }}>{team.leader?.name || <span className="text-secondary">-</span>}</td>
      <td style={{ padding: '1rem' }}>
        {team.supervisors && team.supervisors.length > 0 
          ? team.supervisors.map((s: any) => <div key={s.id}>{s.user.name}</div>)
          : <span className="text-secondary">-</span>}
      </td>
      <td style={{ padding: '1rem' }}>
        {team.assistantLeaders && team.assistantLeaders.length > 0 
          ? team.assistantLeaders.map((a: any) => <div key={a.id}>{a.user.name}</div>)
          : <span className="text-secondary">-</span>}
      </td>
      <td style={{ padding: '1rem' }}>
        <button onClick={() => setIsEditing(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }} title="Edit Team Roles">✏️</button>
      </td>
    </tr>
  );
}

// -----------------------------------------------------------------------------
// SALARIES TAB
// -----------------------------------------------------------------------------
function SalariesTab() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeRoleFilter, setActiveRoleFilter] = useState<'Agents' | 'Team Leaders' | 'Execution Managers' | 'Others'>('Agents');
  const [activeMonth, setActiveMonth] = useState<string>('');

  const loadSalaries = () => {
    setLoading(true);
    getMonthlySalaries().then(res => {
      setData(res);
      if (res.length > 0 && !activeMonth) {
        setActiveMonth(res[0].month);
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    loadSalaries();
  }, []);

  if (loading) return <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>Loading Salaries...</div>;

  return (
    <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
      <style>{`
        details > summary.hide-marker {
          list-style: none;
        }
        details > summary.hide-marker::-webkit-details-marker {
          display: none;
        }
        .role-sidebar {
          width: 250px;
          flex-shrink: 0;
          position: sticky;
          top: 2rem;
        }
        .month-sidebar {
          width: 200px;
          flex-shrink: 0;
          position: sticky;
          top: 2rem;
        }
        .role-btn {
          display: block;
          width: 100%;
          text-align: left;
          padding: 1rem;
          margin-bottom: 0.5rem;
          background: var(--surface);
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          color: var(--text-secondary);
          transition: all 0.2s;
        }
        .role-btn:hover {
          background: var(--surface-hover);
        }
        .role-btn.active {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
        }
      `}</style>
      
      {/* Left Sidebar: Roles */}
      <div className="role-sidebar">
        <div className="card" style={{ padding: '1rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Filter by Role</h3>
          <button 
            className={`role-btn ${activeRoleFilter === 'Agents' ? 'active' : ''}`}
            onClick={() => setActiveRoleFilter('Agents')}
          >
            Sale Agents
          </button>
          <button 
            className={`role-btn ${activeRoleFilter === 'Team Leaders' ? 'active' : ''}`}
            onClick={() => {
                setActiveRoleFilter('Team Leaders');
                if (!activeMonth && data.length > 0) setActiveMonth(data[0].month);
            }}
          >
            Sale Team Leaders
          </button>
          <button 
            className={`role-btn ${activeRoleFilter === 'Execution Managers' ? 'active' : ''}`}
            onClick={() => {
                setActiveRoleFilter('Execution Managers');
                if (!activeMonth && data.length > 0) setActiveMonth(data[0].month);
            }}
          >
            Execution Managers
          </button>
          <button 
            className={`role-btn ${activeRoleFilter === 'Others' ? 'active' : ''}`}
            onClick={() => setActiveRoleFilter('Others')}
          >
            Others
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {activeRoleFilter === 'Team Leaders' ? (
          <div>
            {data.filter(m => m.month === activeMonth).map((monthData, idx) => {
              const teamLeaders = monthData.salaries.filter((s: any) => 
                s.role === 'Team Leader' || s.role === 'Supervisor' || s.role === 'Assistant Team Leader'
              );

              if (teamLeaders.length === 0) return <div key={idx} className="card" style={{ padding: '2rem', textAlign: 'center' }}>No team leaders found for this month.</div>;

              return (
                <div key={monthData.month}>
                  {teamLeaders.map((tl: any) => (
                    <div key={tl.userId} className="card" style={{ marginBottom: '2rem' }}>
                      <h2 style={{ marginBottom: '1.5rem', borderBottom: '2px solid var(--border-subtle)', paddingBottom: '0.5rem', color: 'var(--primary)' }}>
                        {tl.userName} <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>({tl.role})</span>
                      </h2>
                      
                      <div className="table-wrapper">
                        <table>
                          <thead>
                            <tr>
                              <th>Team Name</th>
                              <th>Role</th>
                              <th>Target</th>
                              <th>Cleared</th>
                              <th>Salary</th>
                              <th>Bonus</th>
                              <th>Previous Clearance</th>
                              <th>Allowance</th>
                              <th>Total Salary</th>
                            </tr>
                          </thead>
                          <tbody>
                            {tl.managerTeams && tl.managerTeams.map((team: any, tIdx: number) => (
                              <tr key={tIdx} className="hover-row">
                                <td style={{ fontWeight: 600 }}>{team.teamName}</td>
                                <td>
                                  <span style={{
                                    padding: '0.2rem 0.5rem',
                                    borderRadius: '12px',
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    backgroundColor: team.role === 'Team Leader' ? 'rgba(99, 102, 241, 0.1)' : 
                                                     team.role === 'Supervisor' ? 'rgba(16, 185, 129, 0.1)' : 
                                                     'rgba(245, 158, 11, 0.1)',
                                    color: team.role === 'Team Leader' ? 'var(--primary)' : 
                                           team.role === 'Supervisor' ? 'var(--success)' : 
                                           'var(--warning)'
                                  }}>
                                    {team.role}
                                  </span>
                                </td>
                                <td>${team.target.toLocaleString()}</td>
                                <td style={{ color: 'var(--success)' }}>${team.cleared.toLocaleString()}</td>
                                <td>Rs {team.commission.toLocaleString()}</td>
                                <td>Rs {team.bonus.toLocaleString()}</td>
                                <td>
                                  {team.previousBreakdownWithRs && team.previousBreakdownWithRs.length > 0 ? (
                                    <details style={{ margin: 0 }}>
                                      <summary style={{ cursor: 'pointer', color: 'var(--primary)', fontWeight: 'normal', listStyle: 'none' }} className="hide-marker">
                                        Rs {team.previousCommission.toLocaleString()}
                                      </summary>
                                      <ul style={{ paddingLeft: '0', marginTop: '0.5rem', fontSize: '0.85rem', listStyle: 'none', color: 'var(--text-secondary)', background: 'var(--surface-sunken)', padding: '0.5rem', borderRadius: '4px' }}>
                                        {team.previousBreakdownWithRs.map((pb: any, i: number) => (
                                          <li key={i} style={{ marginBottom: '0.25rem' }}>
                                            <span style={{ fontWeight: 600, color: 'var(--text)' }}>{new Date(pb.month + '-01').toLocaleString('default', { month: 'short', year: 'numeric' })}</span>: ${pb.amountUSD.toLocaleString()} (Rs {pb.amountRs.toLocaleString()})
                                          </li>
                                        ))}
                                      </ul>
                                    </details>
                                  ) : (
                                    <div>Rs {team.previousCommission.toLocaleString()}</div>
                                  )}
                                </td>
                                <td>
                                  {tIdx === 0 ? (
                                    <>
                                      <input 
                                        type="checkbox" 
                                        checked={tl.allowance > 0} 
                                        onChange={async (e) => {
                                          const checked = e.target.checked;
                                          const diff = checked ? 5000 : (tl.allowance > 0 ? -tl.allowance : 0);
                                          
                                          const newData = [...data];
                                          const mIdx = newData.findIndex(m => m.month === monthData.month);
                                          if (mIdx !== -1) {
                                            const sIdx = newData[mIdx].salaries.findIndex((user: any) => user.userId === tl.userId);
                                            if (sIdx !== -1) {
                                              newData[mIdx].salaries[sIdx].allowance = checked ? 5000 : 0;
                                              newData[mIdx].salaries[sIdx].total += diff;
                                            }
                                          }
                                          setData(newData);

                                          await toggleAllowance(tl.userId, monthData.month, checked);
                                          getMonthlySalaries().then(res => setData(res));
                                        }} 
                                      />
                                      Rs {tl.allowance.toLocaleString()}
                                    </>
                                  ) : '-'}
                                </td>
                                <td style={{ fontWeight: 'bold' }}>
                                  Rs {(team.commission + team.bonus + team.previousCommission + (tIdx === 0 ? tl.allowance : 0)).toLocaleString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr style={{ background: 'var(--surface-sunken)', borderTop: '2px solid var(--border-subtle)' }}>
                              <td colSpan={8} style={{ textAlign: 'right', fontWeight: 'bold', padding: '1rem' }}>Grand Total</td>
                              <td style={{ fontWeight: 'bold', padding: '1rem', color: 'var(--primary)', fontSize: '1.1rem' }}>
                                Rs {tl.total.toLocaleString()}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ) : activeRoleFilter === 'Execution Managers' ? (
          <div>
            {data.filter(m => m.month === activeMonth).map((monthData, idx) => {
              const execManagers = monthData.salaries.filter((s: any) => 
                s.role === 'Execution Manager' || s.role === 'Assistant Execution Manager'
              );

              if (execManagers.length === 0) return <div key={idx} className="card" style={{ padding: '2rem', textAlign: 'center' }}>No execution managers found for this month.</div>;

              return (
                <div key={monthData.month}>
                  {execManagers.map((em: any) => (
                    <div key={em.userId} className="card" style={{ marginBottom: '2rem' }}>
                      <h2 style={{ marginBottom: '1.5rem', borderBottom: '2px solid var(--border-subtle)', paddingBottom: '0.5rem', color: 'var(--primary)' }}>
                        {em.userName} <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>({em.role})</span>
                      </h2>
                      
                      <div className="table-wrapper">
                        <table>
                          <thead>
                            <tr>
                              <th>Team Name</th>
                              <th>Role</th>
                              <th>Total Target</th>
                              <th>Total Cleared</th>
                              <th>Cleared in {new Date(monthData.month + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {em.emTeams && em.emTeams.map((team: any, tIdx: number) => (
                              <tr key={tIdx} className="hover-row">
                                <td style={{ fontWeight: 600 }}>{team.teamName}</td>
                                <td>
                                  <span style={{
                                    padding: '0.2rem 0.5rem',
                                    borderRadius: '12px',
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                                    color: 'var(--primary)'
                                  }}>
                                    {team.role}
                                  </span>
                                </td>
                                <td>${team.target.toLocaleString()}</td>
                                <td style={{ color: 'var(--success)' }}>${(team.cleared + team.previousCleared).toLocaleString()}</td>
                                <td>
                                  {team.previousBreakdown && team.previousBreakdown.length > 0 ? (
                                    <details style={{ margin: 0 }}>
                                      <summary style={{ cursor: 'pointer', color: 'var(--primary)', fontWeight: 'normal', listStyle: 'none' }} className="hide-marker">
                                        ${team.previousCleared.toLocaleString()}
                                      </summary>
                                      <ul style={{ paddingLeft: '0', marginTop: '0.5rem', fontSize: '0.85rem', listStyle: 'none', color: 'var(--text-secondary)', background: 'var(--surface-sunken)', padding: '0.5rem', borderRadius: '4px' }}>
                                        {team.previousBreakdown.map((pb: any, i: number) => (
                                          <li key={i} style={{ marginBottom: '0.25rem' }}>
                                            <span style={{ fontWeight: 600, color: 'var(--text)' }}>{new Date(pb.month + '-01').toLocaleString('default', { month: 'short', year: 'numeric' })}</span>: ${pb.amount.toLocaleString()}
                                          </li>
                                        ))}
                                      </ul>
                                    </details>
                                  ) : (
                                    <div>${team.previousCleared.toLocaleString()}</div>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr style={{ background: 'var(--surface-sunken)', borderTop: '2px solid var(--border-subtle)' }}>
                              <td colSpan={2} style={{ textAlign: 'right', fontWeight: 'bold', padding: '1rem' }}>Grand Total (for Salary Calc)</td>
                              <td style={{ fontWeight: 'bold', padding: '1rem' }}>${em.emTeams?.reduce((sum: number, t: any) => sum + t.target, 0).toLocaleString() || 0}</td>
                              <td style={{ fontWeight: 'bold', padding: '1rem', color: 'var(--success)' }}>
                                ${em.emTeams?.reduce((sum: number, t: any) => sum + t.cleared + t.previousCleared, 0).toLocaleString() || 0}
                              </td>
                              <td></td>
                            </tr>
                            <tr style={{ background: 'var(--surface-sunken)' }}>
                              <td colSpan={4} style={{ textAlign: 'right', fontWeight: 'bold', padding: '1rem' }}>Allowance</td>
                              <td style={{ fontWeight: 'bold', padding: '1rem' }}>
                                <input 
                                  type="checkbox" 
                                  checked={em.allowance > 0} 
                                  onChange={async (e) => {
                                    const checked = e.target.checked;
                                    const diff = checked ? 5000 : (em.allowance > 0 ? -em.allowance : 0);
                                    
                                    const newData = [...data];
                                    const mIdx = newData.findIndex(m => m.month === monthData.month);
                                    if (mIdx !== -1) {
                                      const sIdx = newData[mIdx].salaries.findIndex((user: any) => user.userId === em.userId);
                                      if (sIdx !== -1) {
                                        newData[mIdx].salaries[sIdx].allowance = checked ? 5000 : 0;
                                        newData[mIdx].salaries[sIdx].total += diff;
                                      }
                                    }
                                    setData(newData);

                                    await toggleAllowance(em.userId, monthData.month, checked);
                                    getMonthlySalaries().then(res => setData(res));
                                  }} 
                                />
                                Rs {em.allowance.toLocaleString()}
                              </td>
                            </tr>
                            <tr style={{ background: 'var(--surface-sunken)', borderTop: '2px solid var(--border-subtle)' }}>
                              <td colSpan={4} style={{ textAlign: 'right', fontWeight: 'bold', padding: '1rem' }}>Total Salary Payable</td>
                              <td style={{ fontWeight: 'bold', padding: '1rem', color: 'var(--primary)', fontSize: '1.1rem' }}>
                                Rs {em.total.toLocaleString()}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ) : activeRoleFilter === 'Agents' ? (
          <div>
            {data.filter(m => m.month === activeMonth).map((monthData, idx) => {
              const agents = monthData.salaries.filter((s: any) => 
                s.role === 'Employee' && s.teamName !== 'Unassigned'
              );

              if (agents.length === 0) return <div key={idx} className="card" style={{ padding: '2rem', textAlign: 'center' }}>No agents found for this month.</div>;

              // Group agents by teamLeaderName
              const groupedAgents = agents.reduce((acc: any, agent: any) => {
                const tlName = agent.teamLeaderName || 'Unknown Leader';
                if (!acc[tlName]) acc[tlName] = [];
                acc[tlName].push(agent);
                return acc;
              }, {});

              return (
                <div key={monthData.month}>
                  {Object.keys(groupedAgents).map((tlName) => (
                    <div key={tlName} className="card" style={{ marginBottom: '2rem' }}>
                      <h2 style={{ marginBottom: '1.5rem', borderBottom: '2px solid var(--border-subtle)', paddingBottom: '0.5rem', color: 'var(--primary)' }}>
                        Team Leader: {tlName}
                      </h2>
                      
                      <div className="table-wrapper">
                        <table>
                          <thead>
                            <tr>
                              <th>Employee</th>
                              <th>Team</th>
                              <th>Target</th>
                              <th>Cleared</th>
                              <th>Base</th>
                              <th>Bonus</th>
                              <th>Commission</th>
                              <th>Previous Commission</th>
                              <th>Allowance</th>
                              <th>Total Salary</th>
                            </tr>
                          </thead>
                          <tbody>
                            {groupedAgents[tlName].map((s: any) => (
                              <tr key={s.userId} className="hover-row">
                                <td>
                                  <div style={{ fontWeight: 600 }}>{s.userName}</div>
                                </td>
                                <td>
                                  <span style={{
                                    padding: '0.2rem 0.5rem',
                                    borderRadius: '12px',
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                    color: 'var(--success)'
                                  }}>
                                    {s.teamName}
                                  </span>
                                </td>
                                <td>${s.uPerfTarget.toLocaleString()}</td>
                                <td style={{ color: 'var(--success)' }}>${s.uPerfCleared.toLocaleString()}</td>
                                <td>Rs {s.baseSalary.toLocaleString()}</td>
                                <td>Rs {s.bonus.toLocaleString()}</td>
                                <td>Rs {s.commission.toLocaleString()}</td>
                                <td>
                                  {s.previousBreakdownWithRs && s.previousBreakdownWithRs.length > 0 ? (
                                    <details style={{ margin: 0 }}>
                                      <summary style={{ cursor: 'pointer', color: 'var(--primary)', fontWeight: 'normal', listStyle: 'none' }} className="hide-marker">
                                        Rs {s.previousCommission.toLocaleString()}
                                      </summary>
                                      <ul style={{ paddingLeft: '0', marginTop: '0.5rem', fontSize: '0.85rem', listStyle: 'none', color: 'var(--text-secondary)', background: 'var(--surface-sunken)', padding: '0.5rem', borderRadius: '4px' }}>
                                        {s.previousBreakdownWithRs.map((pb: any, idx: number) => (
                                          <li key={idx} style={{ marginBottom: '0.25rem' }}>
                                            <span style={{ fontWeight: 600, color: 'var(--text)' }}>{new Date(pb.month + '-01').toLocaleString('default', { month: 'short', year: 'numeric' })}</span>: ${pb.amountUSD.toLocaleString()} (Rs {pb.amountRs.toLocaleString()})
                                          </li>
                                        ))}
                                      </ul>
                                    </details>
                                  ) : (
                                    <div>Rs {s.previousCommission.toLocaleString()}</div>
                                  )}
                                </td>
                                <td>
                                  <input 
                                    type="checkbox" 
                                    checked={s.allowance > 0} 
                                    onChange={async (e) => {
                                      const checked = e.target.checked;
                                      const diff = checked ? 5000 : (s.allowance > 0 ? -s.allowance : 0);
                                      
                                      const newData = [...data];
                                      const mIdx = newData.findIndex(m => m.month === monthData.month);
                                      if (mIdx !== -1) {
                                        const sIdx = newData[mIdx].salaries.findIndex((user: any) => user.userId === s.userId);
                                        if (sIdx !== -1) {
                                          newData[mIdx].salaries[sIdx].allowance = checked ? 5000 : 0;
                                          newData[mIdx].salaries[sIdx].total += diff;
                                        }
                                      }
                                      setData(newData);

                                      await toggleAllowance(s.userId, monthData.month, checked);
                                      getMonthlySalaries().then(res => setData(res));
                                    }} 
                                  />
                                  Rs {s.allowance.toLocaleString()}
                                </td>
                                <td style={{ fontWeight: 'bold' }}>Rs {s.total.toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ) : (
          <div>
            {data.filter(m => m.month === activeMonth).map((monthData, idx) => {
              const others = monthData.salaries.filter((s: any) => 
                s.role !== 'Execution Manager' && s.role !== 'Assistant Execution Manager' && s.role !== 'Employee' && s.role !== 'Team Leader' && s.role !== 'Supervisor' && s.role !== 'Assistant Team Leader' || (s.role === 'Employee' && s.teamName === 'Unassigned')
              );

              if (others.length === 0) return <div key={idx} className="card" style={{ padding: '2rem', textAlign: 'center' }}>No other employees found for this month.</div>;

              return (
                <div key={monthData.month} className="card" style={{ marginBottom: '2rem' }}>
                  <h2 style={{ marginBottom: '1.5rem', borderBottom: '2px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                    Others
                  </h2>
                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>Employee</th>
                          <th>Role</th>
                          <th>Target</th>
                          <th>Cleared</th>
                          <th>Base</th>
                          <th>Bonus</th>
                          <th>Commission</th>
                          <th>Previous Commission</th>
                          <th>Allowance</th>
                          <th>Total Salary</th>
                        </tr>
                      </thead>
                      <tbody>
                        {others.map((s: any) => (
                          <tr key={s.userId} className="hover-row">
                            <td>
                              <div style={{ fontWeight: 600 }}>{s.userName}</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{s.teamName}</div>
                            </td>
                            <td>
                              <span style={{
                                padding: '0.2rem 0.5rem',
                                borderRadius: '12px',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                                color: 'var(--warning)'
                              }}>
                                {s.role}
                              </span>
                            </td>
                            <td>${s.uPerfTarget.toLocaleString()}</td>
                            <td style={{ color: 'var(--success)' }}>${s.uPerfCleared.toLocaleString()}</td>
                            <td>Rs {s.baseSalary.toLocaleString()}</td>
                            <td>Rs {s.bonus.toLocaleString()}</td>
                            <td>Rs {s.commission.toLocaleString()}</td>
                            <td>
                              <div>Rs {s.previousCommission.toLocaleString()}</div>
                            </td>
                            <td>
                              <input 
                                type="checkbox" 
                                checked={s.allowance > 0} 
                                onChange={async (e) => {
                                  const checked = e.target.checked;
                                  const diff = checked ? 5000 : (s.allowance > 0 ? -s.allowance : 0);
                                  
                                  const newData = [...data];
                                  const mIdx = newData.findIndex(m => m.month === monthData.month);
                                  if (mIdx !== -1) {
                                    const sIdx = newData[mIdx].salaries.findIndex((user: any) => user.userId === s.userId);
                                    if (sIdx !== -1) {
                                      newData[mIdx].salaries[sIdx].allowance = checked ? 5000 : 0;
                                      newData[mIdx].salaries[sIdx].total += diff;
                                    }
                                  }
                                  setData(newData);

                                  await toggleAllowance(s.userId, monthData.month, checked);
                                  getMonthlySalaries().then(res => setData(res));
                                }} 
                              />
                              Rs {s.allowance.toLocaleString()}
                            </td>
                            <td style={{ fontWeight: 'bold' }}>Rs {s.total.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {/* Right Sidebar: Months */}
      {true && (
        <div className="month-sidebar">
          <div className="card" style={{ padding: '1rem' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Select Month</h3>
            {data.map(m => (
              <button 
                key={m.month}
                className={`role-btn ${activeMonth === m.month ? 'active' : ''}`}
                onClick={() => setActiveMonth(m.month)}
              >
                {new Date(m.month + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}
              </button>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------
// UI COMPONENTS
// -----------------------------------------------------------------------------
function MultiSelectDropdown({ options, selectedIds, name }: { options: any[], selectedIds: string[], name: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(selectedIds);

  const toggleSelection = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <div style={{ position: 'relative', minWidth: '120px' }}>
      <div 
        onClick={() => setIsOpen(!isOpen)} 
        className="input" 
        style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem', cursor: 'pointer', background: 'var(--surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', userSelect: 'none' }}
      >
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
          {selected.length === 0 ? 'None' : selected.map(id => options.find(o => o.id === id)?.name).filter(Boolean).join(', ')}
        </span>
        <span style={{ fontSize: '0.7rem', marginLeft: '0.5rem' }}>▼</span>
      </div>
      
      {isOpen && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, background: 'var(--surface)', border: '1px solid var(--border-subtle)', borderRadius: '4px', marginTop: '4px', maxHeight: '150px', overflowY: 'auto', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          {options.map(opt => (
            <label key={opt.id} style={{ display: 'flex', alignItems: 'center', padding: '0.5rem', cursor: 'pointer', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.85rem' }}>
              <input 
                type="checkbox" 
                checked={selected.includes(opt.id)} 
                onChange={() => toggleSelection(opt.id)} 
                style={{ marginRight: '0.5rem' }}
              />
              {opt.name} {opt.employeeId ? `(${opt.employeeId})` : ''}
            </label>
          ))}
          {options.length === 0 && <div style={{ padding: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No options</div>}
        </div>
      )}
      
      {/* Hidden inputs to pass data to Server Action */}
      {selected.map(id => (
        <input key={id} type="hidden" name={name} value={id} />
      ))}
    </div>
  );
}

// -----------------------------------------------------------------------------
// SALARY STRUCTURE TAB
// -----------------------------------------------------------------------------
function SalaryStructureTab({ salaryTiers, departments, unassignedEmployees }: { salaryTiers: any[], departments: any[], unassignedEmployees: any[] }) {
  const [selectedTier, setSelectedTier] = useState<string | null>(salaryTiers[0]?.id || null);
  
  const allEmployeesList = [
    ...departments.flatMap(d => d.teams.flatMap((t: any) => t.members.map((m: any) => ({ ...m, team: t })))),
    ...unassignedEmployees
  ];
  // Deduplicate by ID
  const uniqueEmployees = Array.from(new Map(allEmployeesList.map(e => [e.id, e])).values());

  const activeTier = salaryTiers.find(t => t.id === selectedTier);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem', alignItems: 'start' }}>
      
      {/* Tiers Sidebar */}
      <div className="card" style={{ padding: '0' }}>
        <h3 style={{ padding: '1rem', margin: 0, borderBottom: '1px solid var(--border-subtle)' }}>Salary Tiers</h3>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {salaryTiers.map(tier => (
            <div 
              key={tier.id}
              onClick={() => setSelectedTier(tier.id)}
              style={{ 
                padding: '1rem', 
                cursor: 'pointer', 
                borderBottom: '1px solid var(--border-subtle)',
                background: selectedTier === tier.id ? 'var(--surface-sunken)' : 'transparent',
                borderLeft: selectedTier === tier.id ? '3px solid var(--primary)' : '3px solid transparent'
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{tier.name}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {tier.users?.length || 0} employees assigned
              </div>
            </div>
          ))}
          <div 
            onClick={() => setSelectedTier('TEAM_LEADERS')}
            style={{ 
              padding: '1rem', 
              cursor: 'pointer',
              borderBottom: '1px solid var(--border-subtle)',
              background: selectedTier === 'TEAM_LEADERS' ? 'var(--surface-sunken)' : 'transparent',
              borderLeft: selectedTier === 'TEAM_LEADERS' ? '3px solid var(--primary)' : '3px solid transparent'
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Team Leaders</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {uniqueEmployees.filter(e => e.position === 'Team Leader').length} leaders
            </div>
          </div>
          <div 
            onClick={() => setSelectedTier('EXECUTION_MANAGERS')}
            style={{ 
              padding: '1rem', 
              cursor: 'pointer',
              borderBottom: '1px solid var(--border-subtle)',
              background: selectedTier === 'EXECUTION_MANAGERS' ? 'var(--surface-sunken)' : 'transparent',
              borderLeft: selectedTier === 'EXECUTION_MANAGERS' ? '3px solid var(--primary)' : '3px solid transparent'
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Execution Managers</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {uniqueEmployees.filter(e => e.position === 'Execution Manager').length} managers
            </div>
          </div>
          <div 
            onClick={() => setSelectedTier(null)}
            style={{ 
              padding: '1rem', 
              cursor: 'pointer',
              background: selectedTier === null ? 'var(--surface-sunken)' : 'transparent',
              borderLeft: selectedTier === null ? '3px solid var(--primary)' : '3px solid transparent'
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Unassigned</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {uniqueEmployees.filter(e => !e.salaryTierId && e.position !== 'Team Leader' && e.position !== 'Execution Manager').length} employees
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="card">
        {selectedTier === 'TEAM_LEADERS' ? (
          <ManagerRoleSalarySection 
            title="Team Leaders" 
            managers={uniqueEmployees.filter(e => e.position === 'Team Leader')} 
            allTeams={departments.flatMap(d => d.teams)} 
          />
        ) : selectedTier === 'EXECUTION_MANAGERS' ? (
          <ManagerRoleSalarySection 
            title="Execution Managers" 
            managers={uniqueEmployees.filter(e => e.position === 'Execution Manager')} 
            allTeams={departments.flatMap(d => d.teams)} 
          />
        ) : selectedTier ? (
          <>
            <h2 style={{ marginBottom: '0.5rem' }}>{activeTier?.name}</h2>
            <p className="text-secondary" style={{ marginBottom: '2rem' }}>{activeTier?.description}</p>
            
            <h3 style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Assigned Employees</h3>
            {activeTier?.users?.length > 0 ? (
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {activeTier.users.map((user: any) => (
                  <EmployeeTierRow key={user.id} user={user} allTiers={salaryTiers} />
                ))}
              </div>
            ) : (
              <p className="text-secondary text-sm">No employees assigned to this tier yet.</p>
            )}
          </>
        ) : (
          <>
            <h2 style={{ marginBottom: '0.5rem' }}>Unassigned Employees</h2>
            <p className="text-secondary" style={{ marginBottom: '2rem' }}>These employees do not currently have a salary structure tier assigned.</p>
            
            <h3 style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Employees</h3>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {uniqueEmployees.filter(e => !e.salaryTierId && e.position !== 'Team Leader' && e.position !== 'Execution Manager').map(user => (
                <EmployeeTierRow key={user.id} user={user} allTiers={salaryTiers} />
              ))}
            </div>
          </>
        )}
      </div>

    </div>
  );
}

function EmployeeTierRow({ user, allTiers }: { user: any, allTiers: any[] }) {
  const [isEditing, setIsEditing] = useState(false);
  
  if (isEditing) {
    return (
      <form action={async (fd) => {
        const tierId = fd.get('tierId') as string;
        await assignEmployeeToTier(user.id, tierId === 'null' ? null : tierId);
        setIsEditing(false);
      }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-sunken)', padding: '0.75rem 1rem', borderRadius: '8px' }}>
        <div style={{ fontWeight: 600 }}>{user.name} <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 400 }}>({user.team?.name || 'Unassigned Team'})</span></div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <select name="tierId" defaultValue={user.salaryTierId || 'null'} className="input" style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}>
            <option value="null">Unassigned</option>
            {allTiers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <button type="submit" className="btn primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>Save</button>
          <button type="button" onClick={() => setIsEditing(false)} className="btn secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>Cancel</button>
        </div>
      </form>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-sunken)', padding: '0.75rem 1rem', borderRadius: '8px' }}>
      <div style={{ fontWeight: 600 }}>{user.name} <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 400 }}>({user.team?.name || 'Unassigned Team'})</span></div>
      <button onClick={() => setIsEditing(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: 'var(--primary)', fontWeight: 600 }} title="Change Tier">
        ✏️
      </button>
    </div>
  );
}


export function ManagerRoleSalarySection({ title, managers, allTeams }: { title: string, managers: any[], allTeams: any[] }) {
  const [activeManagerId, setActiveManagerId] = useState<string | null>(managers[0]?.id || null);

  if (managers.length === 0) {
    return (
      <>
        <h2 style={{ marginBottom: '0.5rem' }}>{title}</h2>
        <p className="text-secondary" style={{ marginBottom: '2rem' }}>No {title.toLowerCase()} found.</p>
      </>
    );
  }

  const activeManager = managers.find(m => m.id === activeManagerId);

  return (
    <>
      <h2 style={{ marginBottom: '0.5rem' }}>{title}</h2>
      <p className="text-secondary" style={{ marginBottom: '1.5rem' }}>Configure specific role rates and types for each manager.</p>
      
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        {managers.map(m => (
          <button 
            key={m.id}
            onClick={() => setActiveManagerId(m.id)}
            style={{
              padding: '0.5rem 1rem',
              background: activeManagerId === m.id ? 'var(--primary)' : 'var(--surface-sunken)',
              color: activeManagerId === m.id ? 'white' : 'inherit',
              border: 'none',
              borderRadius: '20px',
              cursor: 'pointer',
              fontWeight: 600,
              whiteSpace: 'nowrap'
            }}
          >
            {m.name}
          </button>
        ))}
      </div>

      {activeManager && (
        <ManagerRoleSalaryTable manager={activeManager} allTeams={allTeams} />
      )}
    </>
  );
}

export function ManagerRoleSalaryTable({ manager, allTeams }: { manager: any, allTeams: any[] }) {
  // Teams where manager is leader
  const ledTeams = allTeams.filter(t => t.leaderId === manager.id);
  // Teams where manager is supervisor
  const supervisedTeams = allTeams.filter(t => t.supervisors?.some((s: any) => s.userId === manager.id));
  // Teams where manager is assistant
  const assistedTeams = allTeams.filter(t => t.assistantLeaders?.some((a: any) => a.userId === manager.id));

  // Flatten out to a list of "Assignments"
  const assignments: any[] = [];
  ledTeams.forEach(t => assignments.push({ team: t, role: 'Team Leader', rate: t.leaderRate || 0, type: t.leaderRateType || 'CLEARED', roleCode: 'LEADER' }));
  supervisedTeams.forEach(t => {
    const s = t.supervisors.find((x: any) => x.userId === manager.id);
    assignments.push({ team: t, role: 'Supervisor', rate: s.rate || 0, type: s.type || 'CLEARED', roleCode: 'SUPERVISOR' });
  });
  assistedTeams.forEach(t => {
    const a = t.assistantLeaders.find((x: any) => x.userId === manager.id);
    assignments.push({ team: t, role: 'Assistant Team Leader', rate: a.rate || 0, type: a.type || 'TARGET', roleCode: 'ASSISTANT' });
  });

  return (
    <div>
      <h3 style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Role Assignments & Rates</h3>
      
      {assignments.length > 0 ? (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr>
                <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-subtle)' }}>Team</th>
                <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-subtle)' }}>Role</th>
                <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-subtle)' }}>Rate (/$1000)</th>
                <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-subtle)' }}>Type</th>
                <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-subtle)' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((assignment, idx) => (
                <RoleRateRow key={`${assignment.team.id}-${assignment.roleCode}-${idx}`} assignment={assignment} userId={manager.id} />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-secondary text-sm">No specific team roles assigned.</p>
      )}
    </div>
  );
}


