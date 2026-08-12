import { PrismaClient, User, Team, TeamSupervisor, TeamAssistant } from '@prisma/client'

const prisma = new PrismaClient()

export type UserWithRelations = User & {
  leadsTeams: Team[]
  supervises: (TeamSupervisor & { team: Team })[]
  assists: (TeamAssistant & { team: Team })[]
}

export async function getUserPermissions(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      leadsTeams: true,
      supervises: { include: { team: true } },
      assists: { include: { team: true } }
    }
  })

  if (!user) throw new Error("User not found")

  const isAdmin = user.position === 'Admin'
  const isTeamLeader = user.position === 'Team Leader'
  
  const visibleTeamIds = new Set<string>()
  const teamsWithSupervisorPaymentsVisible = new Set<string>()
  
  if (isAdmin) {
    const allTeams = await prisma.team.findMany()
    allTeams.forEach(t => {
      visibleTeamIds.add(t.id)
      teamsWithSupervisorPaymentsVisible.add(t.id)
    })
  } else if (isTeamLeader) {
    user.leadsTeams.forEach(t => {
      visibleTeamIds.add(t.id)
      teamsWithSupervisorPaymentsVisible.add(t.id)
    })
    user.supervises.forEach(s => {
      visibleTeamIds.add(s.teamId)
      teamsWithSupervisorPaymentsVisible.add(s.teamId)
    })
    user.assists.forEach(o => {
      visibleTeamIds.add(o.teamId)
      teamsWithSupervisorPaymentsVisible.add(o.teamId)
    })
  }

  return {
    user,
    isAdmin,
    isTeamLeader,
    visibleTeamIds: Array.from(visibleTeamIds),
    teamsWithSupervisorPaymentsVisible: Array.from(teamsWithSupervisorPaymentsVisible)
  }
}

export async function getDashboardDataForUser(userId: string) {
  const perms = await getUserPermissions(userId);
  
  const visibleTeams = await prisma.team.findMany({
    where: {
      id: { in: perms.visibleTeamIds }
    },
    include: {
      leader: true,
      members: {
        include: {
          salesMade: {
            include: {
              payments: true
            }
          }
        }
      },
      supervisors: {
        include: { user: true }
      },
      assistantLeaders: {
        include: { user: true }
      },
      sales: {
        include: {
          payments: true
        }
      }
    }
  })
  
  // Transform data to calculate Target and Cleared dynamically using SQL-like maps
  const teamsWithStats = visibleTeams.map(team => {
    
    // Team Aggregates
    const teamTarget = team.sales.reduce((sum, sale) => sum + sale.targetAmount, 0);
    const teamCleared = team.sales.reduce((sum, sale) => {
      return sum + sale.payments.reduce((pSum, p) => pSum + p.amount, 0);
    }, 0);
    
    // Employee Aggregates
    const membersWithStats = team.members.map(member => {
      const target = member.salesMade.reduce((sum, sale) => sum + sale.targetAmount, 0);
      const cleared = member.salesMade.reduce((sum, sale) => {
        return sum + sale.payments.reduce((pSum, p) => pSum + p.amount, 0);
      }, 0);
      return { ...member, target, cleared };
    });
    
    return {
      ...team,
      teamTarget,
      teamCleared,
      members: membersWithStats
    }
  });

  return {
    permissions: perms,
    teamsData: teamsWithStats
  }
}
