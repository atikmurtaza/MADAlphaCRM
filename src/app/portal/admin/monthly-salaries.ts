'use server';

import { PrismaClient } from '@prisma/client';
import { calculateManagerCommission } from '@/lib/payroll-engine';

const prisma = new PrismaClient();

export async function getMonthlySalaries() {
  const allSales = await prisma.sale.findMany({
    include: { 
      payments: true, 
      agent: true, 
      team: true,
      project: {
        include: {
          assignments: true
        }
      }
    }
  });

  const allUsers = await prisma.user.findMany({
    include: {
      team: true,
      salaryTier: true,
      leadsTeams: true,
      supervises: { include: { team: true } },
      assists: { include: { team: true } },
      compensationProfiles: {
        orderBy: { validFrom: 'desc' },
        take: 1
      }
    }
  });

  const allSnapshots = await prisma.monthlyPayrollSnapshot.findMany();

  const monthsSet = new Set<string>();
  allSales.forEach(s => {
    monthsSet.add(s.createdAt.toISOString().substring(0, 7));
    if (s.status === 'COMPLETED' && s.clearedAt) {
      monthsSet.add(s.clearedAt.toISOString().substring(0, 7));
    }
  });
  
  const sortedMonths = Array.from(monthsSet).sort().reverse();
  const results = [];

  for (const monthStr of sortedMonths) {
    const monthSalesCreated = allSales.filter(s => s.createdAt.toISOString().substring(0, 7) === monthStr);
    const monthSalesCleared = allSales.filter(s => s.status === 'COMPLETED' && s.clearedAt && s.clearedAt.toISOString().substring(0, 7) === monthStr && s.createdAt.toISOString().substring(0, 7) !== monthStr);

    const teamPerf = new Map<string, { target: number, cleared: number, previousCleared: number, previousBreakdown: { month: string, amount: number }[] }>();
    const userPerf = new Map<string, { target: number, cleared: number, previousCleared: number, previousBreakdown: { month: string, amount: number }[] }>();
    const emPerf = new Map<string, Map<string, { teamName: string, target: number, cleared: number, previousCleared: number, previousBreakdown: { month: string, amount: number }[] }>>();

    const addPerf = (sale: any, target: number, cleared: number, isPrevious: boolean = false, creationMonth: string = '') => {
      const teamId = sale.teamId;
      const userId = sale.agentId;
      
      // execution manager logic
      if (sale.project && sale.project.assignments) {
        sale.project.assignments.forEach((a: any) => {
          if (a.role === 'PRIMARY_EXECUTION_MANAGER' || a.role === 'ASSISTANT_EXECUTION_MANAGER') {
            if (!emPerf.has(a.employeeId)) emPerf.set(a.employeeId, new Map());
            const emTeams = emPerf.get(a.employeeId)!;
            if (!emTeams.has(sale.teamId)) emTeams.set(sale.teamId, { teamName: sale.team?.name || 'Unknown', target: 0, cleared: 0, previousCleared: 0, previousBreakdown: [] });
            const emT = emTeams.get(sale.teamId)!;
            
            emT.target += target;
            if (isPrevious) {
               emT.previousCleared += cleared;
               if (creationMonth) {
                  const existing = emT.previousBreakdown.find(b => b.month === creationMonth);
                  if (existing) existing.amount += cleared;
                  else emT.previousBreakdown.push({ month: creationMonth, amount: cleared });
               }
            } else {
               emT.cleared += cleared;
            }
          }
        });
      }
      if (!teamPerf.has(teamId)) teamPerf.set(teamId, { target: 0, cleared: 0, previousCleared: 0, previousBreakdown: [] });
      if (!userPerf.has(userId)) userPerf.set(userId, { target: 0, cleared: 0, previousCleared: 0, previousBreakdown: [] });
      
      const tPerf = teamPerf.get(teamId)!;
      const uPerf = userPerf.get(userId)!;
      
      tPerf.target += target;
      uPerf.target += target;
      
      if (isPrevious) {
        tPerf.previousCleared += cleared;
        uPerf.previousCleared += cleared;
        if (creationMonth) {
          const existingU = uPerf.previousBreakdown.find(b => b.month === creationMonth);
          if (existingU) {
            existingU.amount += cleared;
          } else {
            uPerf.previousBreakdown.push({ month: creationMonth, amount: cleared });
          }
          const existingT = tPerf.previousBreakdown.find(b => b.month === creationMonth);
          if (existingT) {
            existingT.amount += cleared;
          } else {
            tPerf.previousBreakdown.push({ month: creationMonth, amount: cleared });
          }
        }
      } else {
        tPerf.cleared += cleared;
        uPerf.cleared += cleared;
      }
    };

    monthSalesCreated.forEach(s => {
      let clearedAmt = 0;
      if (s.status === 'COMPLETED' && s.clearedAt && s.clearedAt.toISOString().substring(0, 7) === monthStr) {
        clearedAmt = s.targetAmount;
      } else {
        clearedAmt = s.payments.filter(p => p.recordedAt.toISOString().substring(0, 7) === monthStr).reduce((sum, p) => sum + p.amount, 0);
      }
      addPerf(s, s.targetAmount, clearedAmt);
    });

    monthSalesCleared.forEach(s => {
      const creationMonth = s.createdAt.toISOString().substring(0, 7);
      const paymentsInCreationMonth = s.payments.filter(p => p.recordedAt.toISOString().substring(0, 7) === creationMonth).reduce((sum, p) => sum + p.amount, 0);
      const remainingBalance = s.targetAmount - paymentsInCreationMonth;
      addPerf(s, 0, remainingBalance, true, creationMonth);
    });

    const monthSalesRefunded = allSales.filter(s => s.status === 'REFUNDED' && s.clearedAt && s.clearedAt.toISOString().substring(0, 7) === monthStr);
    monthSalesRefunded.forEach(s => {
      const paidSoFar = s.payments.reduce((sum: number, p: any) => sum + p.amount, 0);
      // Deduct target and cleared from current month
      addPerf(s, -s.targetAmount, -paidSoFar, false);
    });

    // Format performanceData for manager commission
    const performanceData = Array.from(teamPerf.entries()).map(([teamId, data]) => ({
      teamId,
      teamName: allSales.find(s => s.teamId === teamId)?.team?.name || 'Unknown Team',
      target: data.target,
      cleared: data.cleared,
      previousCleared: data.previousCleared,
      previousBreakdown: data.previousBreakdown
    }));

    const salaries = allUsers.map(user => {
      const uPerf = userPerf.get(user.id) || { target: 0, cleared: 0, previousCleared: 0, previousBreakdown: [] as { month: string, amount: number }[] };
      
      let baseSalary = user.baseSalary || 0;
      let commission = 0;
      let previousCommission = 0;
      let bonus = 0;
      let managerCommission = 0;
      let breakdown: { teamName: string, role: string, amount: number, description: string }[] = [];
      let previousBreakdownWithRs: { month: string, amountUSD: number, amountRs: number }[] = [];
      let managerTeams: any[] = [];
      let emTeams: any[] = [];
      
      if (user.position === 'Execution Manager' || user.position === 'Assistant Execution Manager') {
        const userEmPerf = emPerf.get(user.id);
        if (userEmPerf) {
          let grandTotalTarget = 0;
          let grandTotalCleared = 0;
          let grandTotalPreviousCleared = 0;
          
          const profile = user.compensationProfiles && user.compensationProfiles.length > 0 ? user.compensationProfiles[0] : null;
          const rate1 = profile?.emCommissionRate1 || 10;
          const rate2 = profile?.emCommissionRate2 || 5;
          const threshold = profile?.emCommissionThreshold || 10000;
          
          Array.from(userEmPerf.entries()).forEach(([teamId, data]) => {
             grandTotalTarget += data.target;
             grandTotalCleared += data.cleared;
             grandTotalPreviousCleared += data.previousCleared;
             
             emTeams.push({
               teamId,
               teamName: data.teamName,
               role: user.position,
               target: data.target,
               cleared: data.cleared,
               previousCleared: data.previousCleared,
               previousBreakdown: data.previousBreakdown
             });
          });
          
          const totalClearedForCalc = grandTotalCleared + grandTotalPreviousCleared;
          
          if (totalClearedForCalc <= threshold) {
             commission = totalClearedForCalc * rate1;
          } else {
             commission = (threshold * rate1) + ((totalClearedForCalc - threshold) * rate2);
          }
        }
      }
        
      const monthSnapshots = allSnapshots.filter(s => s.month === monthStr);
      const allowance = monthSnapshots.find(s => s.userId === user.id)?.allowance || 0;
        
      const isTeamLeader = user.position === 'Team Leader';
      
      if (isTeamLeader) {
        // Team Leaders are paid from team clearance, no personal commission tier applies
        const managerResult = calculateManagerCommission(user, performanceData);
        
        baseSalary = managerResult.totalCurrentCommission;
        previousCommission = managerResult.totalPreviousCommission;
        commission = 0;
        bonus = managerResult.totalBonus;
        managerTeams = managerResult.managerTeams;
        
        // Aggregate targets and cleared for the teams they lead or supervise
        const ledTeams = user.leadsTeams?.map((t: any) => t.id) || [];
        const supTeams = user.supervises?.map((s: any) => s.teamId) || [];
        const astTeams = user.assists?.map((a: any) => a.teamId) || [];
        const allManagedTeamIds = new Set([...ledTeams, ...supTeams, ...astTeams]);
        
        uPerf.target = 0;
        uPerf.cleared = 0;
        uPerf.previousCleared = 0;
        
        for (const tid of Array.from(allManagedTeamIds)) {
          const perf = teamPerf.get(tid as string);
          if (perf) {
            uPerf.target += perf.target;
            uPerf.cleared += perf.cleared;
            uPerf.previousCleared += perf.previousCleared;
          }
        }
      } else {
        if (user.salaryTier) {
          const tierName = user.salaryTier.name;
          
          let commissionThreshold = 1000;
          let commissionRate = 40;

          if (tierName.includes('Tier 2') || tierName.includes('Standard 50/50k')) {
            baseSalary = Math.min(uPerf.target * 50, 50000);
            bonus = Math.floor(uPerf.target / 1000) * 10000;
            commissionThreshold = 1000;
          } else if (tierName.includes('Tier 4') || tierName.includes('Variable Threshold')) {
            baseSalary = uPerf.target > 499 ? Math.min(uPerf.target * 50, 25000) : Math.min(uPerf.target * 40, 20000);
            bonus = uPerf.target >= 3000 ? 20000 : Math.floor(uPerf.target / 1000) * 5000;
            commissionThreshold = 500;
          } else if (tierName.includes('Tier 6') || tierName.includes('12.5k fixed')) {
            baseSalary = uPerf.target <= 300 ? 12500 : Math.min(uPerf.target * 50, 50000);
            bonus = Math.floor(uPerf.target / 1000) * 10000;
            commissionThreshold = 1000;
          } else if (tierName.includes('Tier 7') || tierName.includes('10k fixed')) {
            baseSalary = uPerf.target <= 300 ? 10000 : Math.min(uPerf.target * 40, 40000);
            bonus = uPerf.target >= 3000 ? 20000 : Math.floor(uPerf.target / 1000) * 5000;
            commissionThreshold = 1000;
          } else if (tierName.includes('Tier 5') || tierName.includes('15k fixed')) {
            baseSalary = uPerf.target <= 300 ? 15000 : Math.min(40000, 15000 + (uPerf.target - 300) * 40);
            bonus = uPerf.target >= 3000 ? 20000 : Math.floor(uPerf.target / 1000) * 5000;
            commissionThreshold = 1000;
          } else if (tierName.includes('Tier 1') || tierName.includes('Capped Bonus')) {
            baseSalary = Math.min(uPerf.target * 50, 50000);
            bonus = uPerf.target >= 1000 ? 20000 : 0;
            commissionThreshold = 1000;
          } else if (tierName.includes('Tier 3') || tierName.includes('Delayed Bonus')) {
            baseSalary = Math.min(uPerf.target * 50, 50000);
            bonus = uPerf.target >= 2000 ? 10000 + Math.floor((uPerf.target - 2000) / 1000) * 10000 : 0;
            commissionThreshold = 1000;
          } else if (tierName.includes('Tier 8') || tierName.includes('5k fixed')) {
            baseSalary = uPerf.target <= 100 ? 5000 : Math.min(5000 + (uPerf.target - 100) * 37.5, 20000);
            bonus = uPerf.target >= 3000 ? 20000 : Math.floor(uPerf.target / 1000) * 5000;
            commissionThreshold = 500;
          }

          if (uPerf.cleared > commissionThreshold) {
            commission = (uPerf.cleared - commissionThreshold) * commissionRate;
          }
          if (uPerf.previousCleared > 0) {
            previousCommission = uPerf.previousCleared * commissionRate;
          }

          breakdown.push({ 
            role: `Agent Sales (${tierName})`, 
            description: `Target: $${uPerf.target}, Cleared: $${uPerf.cleared}, Previous Cleared: $${uPerf.previousCleared}`, 
            amount: commission + previousCommission + bonus + baseSalary,
            teamName: 'Personal Sales'
          });
        }

        if (uPerf.previousBreakdown && uPerf.previousBreakdown.length > 0) {
          const commissionRate = user.salaryTier?.name?.includes('Tier 4') ? 40 : 40; 
          previousBreakdownWithRs = uPerf.previousBreakdown.map(pb => ({
            month: pb.month,
            amountUSD: pb.amount,
            amountRs: pb.amount * commissionRate
          }));
        }
        
        // Add manager calculation for employees who might supervise (e.g. Bilal)
        const managerResult = calculateManagerCommission(user, performanceData);
        managerCommission = managerResult.totalCurrentCommission;
        breakdown.push(...managerResult.breakdown);
      }

      let teamLeaderName = 'Unknown';
      if (!isTeamLeader && user.teamId) {
        const tl = allUsers.find(u => u.position === 'Team Leader' && u.leadsTeams?.some((t: any) => t.id === user.teamId));
        if (tl) teamLeaderName = tl.name;
      }

      return {
        userId: user.id,
        userName: user.name,
        role: isTeamLeader ? 'Team Leader' : (user.position || 'Employee'),
        teamId: isTeamLeader ? null : user.teamId,
        teamName: isTeamLeader ? 'Multiple Teams' : (user.team?.name || 'Unassigned'),
        teamLeaderName,
        uPerfTarget: uPerf.target,
        uPerfCleared: uPerf.cleared,
        baseSalary,
        bonus,
        commission,
        managerCommission,
        previousCommission,
        previousBreakdownWithRs,
        allowance,
        breakdown,
        managerTeams,
        emTeams,
        total: baseSalary + bonus + commission + managerCommission + previousCommission + allowance
      };
    });

    results.push({ month: monthStr, salaries: salaries.filter(s => s.total > 0 || s.uPerfTarget > 0 || s.uPerfCleared > 0 || s.previousCommission > 0) });
  }

  return results;
}

export async function getEmployeeSalaries(userId: string) {
  const allMonths = await getMonthlySalaries();
  const employeeResults = [];
  
  for (const month of allMonths) {
    const employeeSalary = month.salaries.find(s => s.userId === userId);
    if (employeeSalary) {
      employeeResults.push({
        month: month.month,
        salary: employeeSalary
      });
    }
  }
  
  return employeeResults;
}
