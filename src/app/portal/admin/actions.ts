'use server';

import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

export async function addDepartment(formData: FormData) {
  const name = formData.get('name') as string;
  if (!name) return;
  await prisma.department.create({ data: { name } });
  revalidatePath('/portal/admin');
}

export async function addTeam(formData: FormData) {
  const name = formData.get('name') as string;
  const departmentId = formData.get('departmentId') as string;
  const leaderId = formData.get('leaderId') as string;
  
  if (!name || !departmentId) return;
  
  await prisma.team.create({
    data: {
      name,
      departmentId,
      leaderId: leaderId || null,
      members: leaderId ? { connect: { id: leaderId } } : undefined
    }
  });
  
  if (leaderId) {
    // Make sure the leader is part of the team and their position is Team Leader
    await prisma.user.update({
      where: { id: leaderId },
      data: { position: 'Team Leader', teamId: null } // Wait, they should be in this team.
    });
    // Wait, the create query already connected them to `members`. But `teamId` must also be set for them.
    const team = await prisma.team.findUnique({ where: { name } });
    if (team) {
      await prisma.user.update({
        where: { id: leaderId },
        data: { teamId: team.id }
      });
    }
  }
  revalidatePath('/portal/admin');
}

export async function updateTeam(teamId: string, formData: FormData) {
  const name = formData.get('name') as string;
  if (!name) return { success: false, message: 'Name is required' };
  
  await prisma.team.update({
    where: { id: teamId },
    data: { name }
  });
  
  revalidatePath('/portal/admin');
  return { success: true };
}

export async function assignEmployeeToTier(userId: string, tierId: string | null) {
  await prisma.user.update({
    where: { id: userId },
    data: { salaryTierId: tierId }
  });
  revalidatePath('/portal/admin');
  return { success: true };
}

export async function assignTeamRoles(teamId: string, leaderId: string | null, supervisorIds: string[], assistantIds: string[]) {
  // Update leaderId
  await prisma.team.update({
    where: { id: teamId },
    data: { leaderId: leaderId || null }
  });

  // Handle Supervisors
  const existingSupervisors = await prisma.teamSupervisor.findMany({ where: { teamId } });
  const existingSupIds = existingSupervisors.map(s => s.userId);
  
  // Delete removed supervisors
  const supsToRemove = existingSupIds.filter(id => !supervisorIds.includes(id));
  if (supsToRemove.length > 0) {
    await prisma.teamSupervisor.deleteMany({
      where: { teamId, userId: { in: supsToRemove } }
    });
  }
  
  // Add new supervisors
  const supsToAdd = supervisorIds.filter(id => !existingSupIds.includes(id));
  for (const userId of supsToAdd) {
    await prisma.teamSupervisor.create({
      data: { teamId, userId, rate: 0, type: 'CLEARED' }
    });
  }

  // Handle Assistant Leaders
  const existingAssistants = await prisma.teamAssistant.findMany({ where: { teamId } });
  const existingAstIds = existingAssistants.map(a => a.userId);
  
  // Delete removed assistants
  const astsToRemove = existingAstIds.filter(id => !assistantIds.includes(id));
  if (astsToRemove.length > 0) {
    await prisma.teamAssistant.deleteMany({
      where: { teamId, userId: { in: astsToRemove } }
    });
  }
  
  // Add new assistants
  const astsToAdd = assistantIds.filter(id => !existingAstIds.includes(id));
  for (const userId of astsToAdd) {
    await prisma.teamAssistant.create({
      data: { teamId, userId, rate: 0, type: 'TARGET' }
    });
  }

  revalidatePath('/portal/admin');
  return { success: true };
}

export async function updateRoleRate(teamId: string, userId: string, roleType: 'LEADER' | 'SUPERVISOR' | 'ASSISTANT', rate: number, type: string) {
  if (roleType === 'LEADER') {
    await prisma.team.update({
      where: { id: teamId },
      data: { leaderRate: rate, leaderRateType: type }
    });
  } else if (roleType === 'SUPERVISOR') {
    await prisma.teamSupervisor.update({
      where: { userId_teamId: { userId, teamId } },
      data: { rate, type }
    });
  } else if (roleType === 'ASSISTANT') {
    await prisma.teamAssistant.update({
      where: { userId_teamId: { userId, teamId } },
      data: { rate, type }
    });
  }
  
  revalidatePath('/portal/admin');
  return { success: true };
}

export async function addEmployee(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const position = formData.get('position') as string;
  const teamId = formData.get('teamId') as string;
  const baseSalary = parseFloat(formData.get('baseSalary') as string) || 25000;
  
  if (!name || !email) return;

  // Generate unique 4-char ID
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let employeeId = '';
  let isUnique = false;

  while (!isUnique) {
    employeeId = '';
    for (let i = 0; i < 4; i++) {
      employeeId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const exists = await prisma.usedEmployeeId.findUnique({ where: { employeeId } });
    if (!exists) {
      isUnique = true;
    }
  }
  
  let departmentId = null;
  if (teamId) {
    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (team) departmentId = team.departmentId;
  }

  const user = await prisma.user.create({
    data: {
      name,
      email,
      position,
      teamId: teamId || null,
      departmentId,
      baseSalary,
      employeeId
    }
  });

  await prisma.usedEmployeeId.create({
    data: {
      employeeId,
      userId: user.id
    }
  });

  revalidatePath('/portal/admin');
}

export async function updateEmployee(userId: string, formData: FormData) {
  const name = formData.get('name') as string;
  const position = formData.get('position') as string;
  const employeeId = formData.get('employeeId') as string || null;
  const newTeamId = formData.get('teamId') as string;
  const newDepartmentId = formData.get('departmentId') as string;
  
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { team: true } });
  if (!user) return { success: false, message: 'User not found' };
  
  // Validate Unique ID
  if (employeeId && employeeId !== user.employeeId) {
    const existingUsed = await prisma.usedEmployeeId.findUnique({ where: { employeeId } });
    if (existingUsed) {
      return { success: false, message: 'Unique ID is already assigned or has been used historically.' };
    }
  }

  const oldTeamId = user.teamId;
  
  const data: any = {
    name,
    position,
    employeeId
  };
  
  if (newDepartmentId) {
    data.departmentId = newDepartmentId;
  }
  
  if (newTeamId && oldTeamId !== newTeamId) {
    data.teamId = newTeamId;
    if (oldTeamId) {
      data.formerTeams = { connect: { id: oldTeamId } };
    }
  } else if (!newTeamId) {
    data.teamId = null;
  }
  
  const leadsTeamsIds = formData.getAll('leadsTeams') as string[];
  if (position === 'Team Leader' || leadsTeamsIds.length > 0) {
    data.leadsTeams = {
      set: leadsTeamsIds.map(id => ({ id }))
    };
  } else if (user.position === 'Team Leader' && position !== 'Team Leader') {
    data.leadsTeams = { set: [] };
  }
  
  await prisma.user.update({
    where: { id: userId },
    data
  });

  if (employeeId && employeeId !== user.employeeId) {
    await prisma.usedEmployeeId.create({
      data: {
        employeeId,
        userId
      }
    });
  }
  
  revalidatePath('/portal/admin');
  if (oldTeamId) revalidatePath(`/portal/leader/${oldTeamId}`);
  if (newTeamId) revalidatePath(`/portal/leader/${newTeamId}`);
  
  return { success: true };
}

export async function toggleAllowance(userId: string, month: string, enable: boolean) {
  const allowance = enable ? 5000 : 0;
  await prisma.monthlyPayrollSnapshot.upsert({
    where: { userId_month: { userId, month } },
    update: { allowance },
    create: {
      userId,
      month,
      allowance,
      target: 0,
      clearedAtClose: 0,
      remaining: 0,
      calculatedSalary: 0,
      calculatedBonus: 0,
      grossTotal: 0
    }
  });
  revalidatePath('/portal/admin');
  revalidatePath(`/portal/employee/${userId}`);
}
