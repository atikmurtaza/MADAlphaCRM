import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function calculatePayroll(userId: string, monthStr: string, manualAllowance: number = 0) {
  // Stubbed out based on previous requirements to allow compilation
  const profile = await prisma.compensationProfile.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });

  if (!profile) {
    throw new Error(`No compensation profile found for user ${userId}`);
  }

  return {
    target: 0,
    cleared: 0,
    remaining: 0,
    calculatedSalary: 0,
    calculatedBonus: 0,
    allowance: manualAllowance,
    totalCommissionEarned: 0,
    totalEMEarned: 0,
    totalLeadershipEarned: 0,
    grossTotal: 0,
    incrementalCommission: 0,
    incrementalEM: 0,
    emCleared: 0,
    incrementalLeadership: 0,
    teamCleared: 0
  };
}

export interface TeamPerformance {
  teamId: string;
  teamName: string;
  target: number;
  cleared: number;
  previousCleared?: number;
  previousBreakdown?: { month: string, amount: number }[];
}

export interface ManagerCommissionResult {
  userId: string;
  userName: string;
  totalCurrentCommission: number;
  totalPreviousCommission: number;
  totalBonus: number;
  breakdown: {
    teamName: string;
    role: string;
    amount: number;
    description: string;
  }[];
  managerTeams: {
    teamId: string;
    teamName: string;
    role: string;
    target: number;
    cleared: number;
    commission: number;
    bonus: number;
    previousCommission: number;
    previousBreakdownWithRs: { month: string, amountUSD: number, amountRs: number }[];
  }[];
}

export function calculateManagerCommission(
  user: any,
  performanceData: TeamPerformance[]
): ManagerCommissionResult {
  let totalCurrentCommission = 0;
  let totalPreviousCommission = 0;
  let totalBonus = 0;
  const breakdown: any[] = [];
  const managerTeams: any[] = [];

  const addOrUpdateManagerTeam = (
    teamId: string, teamName: string, role: string, 
    target: number, cleared: number, currentComm: number, bonus: number,
    previousComm: number, prevBreakdown: any[], desc: string
  ) => {
    managerTeams.push({
      teamId, teamName, role, target, cleared,
      commission: currentComm, bonus, previousCommission: previousComm,
      previousBreakdownWithRs: prevBreakdown
    });
    if (currentComm > 0 || bonus > 0) {
      breakdown.push({ teamName, role, amount: currentComm + bonus, description: desc });
    }
  };

  const calculateAmount = (metric: number, team: any, roleType: 'leader' | 'supervisor' | 'assistant') => {
    let baseAmount = 0;
    let bonusAmount = 0;
    let desc = '';

    if (roleType === 'leader') {
      if (team.leaderRateType === 'CLEARED_TIERED_40_50') {
        const upTo10k = Math.min(10000, metric) * 40;
        const above10k = Math.max(0, metric - 10000) * 50;
        baseAmount = upTo10k + above10k;
        desc = `Tiered ($40 up to 10k, $50 above): ${baseAmount}`;
      } else {
        const rate = team.leaderRate || 0;
        baseAmount = metric * rate;
        desc = `${metric} @ Rs${rate}/$1`;

        if (team.leaderRateType === 'CLEARED_BONUS_1X_FLOOR') {
          bonusAmount = Math.floor(metric / 5000) * 5000;
          desc += ` + $${bonusAmount} (1x Floor Bonus)`;
        } else if (team.leaderRateType === 'CLEARED_BONUS_2X_FLOOR') {
          bonusAmount = 2 * (Math.floor(metric / 5000) * 5000);
          desc += ` + $${bonusAmount} (2x Floor Bonus)`;
        }
      }
    } else {
      const rate = roleType === 'supervisor' ? team.rate : team.rate;
      baseAmount = metric * rate;
      desc = `${metric} @ Rs${rate}/$1`;
    }
    return { baseAmount, bonusAmount, desc };
  };

  if (user.leadsTeams && user.leadsTeams.length > 0) {
    for (const team of user.leadsTeams) {
      const perf = performanceData.find(p => p.teamId === team.id) || { teamId: team.id, teamName: team.name, target: 0, cleared: 0, previousCleared: 0, previousBreakdown: [] };

      const target = perf.target;
      const cleared = perf.cleared;
      const previousCleared = perf.previousCleared || 0;
      
      let thresholdMultiplier = 0;
      if (target > 0) {
        const pct = cleared / target;
        if (pct >= 0.4) {
          thresholdMultiplier = 1.0;
        } else if (pct >= 0.3) {
          thresholdMultiplier = 0.5;
        }
      }

      const metric = team.leaderRateType?.includes('TARGET') ? target : cleared;
      const { baseAmount, bonusAmount, desc } = calculateAmount(metric, team, 'leader');

      const currentComm = baseAmount * thresholdMultiplier;
      const bonus = bonusAmount * thresholdMultiplier;

      // Calculate previous
      let previousComm = 0;
      const previousBreakdownWithRs: any[] = [];
      
      if (previousCleared > 0 && perf.previousBreakdown) {
        let prevMetric = team.leaderRateType?.includes('TARGET') ? 0 : previousCleared;
        const prevResult = calculateAmount(prevMetric, team, 'leader');
        previousComm = prevResult.baseAmount; 
        
        for (const pb of perf.previousBreakdown) {
            const pbMetric = team.leaderRateType?.includes('TARGET') ? 0 : pb.amount;
            const pbResult = calculateAmount(pbMetric, team, 'leader');
            previousBreakdownWithRs.push({
                month: pb.month,
                amountUSD: pb.amount,
                amountRs: pbResult.baseAmount
            });
        }
      }

      totalCurrentCommission += currentComm;
      totalBonus += bonus;
      totalPreviousCommission += previousComm;
      
      addOrUpdateManagerTeam(
        team.id, team.name, 'Team Leader', target, cleared, currentComm, bonus, previousComm, previousBreakdownWithRs, `${desc} [Multiplier: ${thresholdMultiplier * 100}%]`
      );
    }
  }

  if (user.supervises && user.supervises.length > 0) {
    for (const sup of user.supervises) {
      const perf = performanceData.find(p => p.teamId === sup.teamId) || { teamId: sup.teamId, teamName: sup.team.name, target: 0, cleared: 0, previousCleared: 0, previousBreakdown: [] };

      const metric = sup.type === 'TARGET' ? perf.target : perf.cleared;
      const { baseAmount, desc } = calculateAmount(metric, sup, 'supervisor');
      
      let previousComm = 0;
      const previousBreakdownWithRs: any[] = [];
      if ((perf.previousCleared || 0) > 0 && perf.previousBreakdown) {
        let prevMetric = sup.type === 'TARGET' ? 0 : perf.previousCleared;
        const prevResult = calculateAmount(prevMetric!, sup, 'supervisor');
        previousComm = prevResult.baseAmount;
        for (const pb of perf.previousBreakdown) {
            const pbMetric = sup.type === 'TARGET' ? 0 : pb.amount;
            const pbResult = calculateAmount(pbMetric, sup, 'supervisor');
            previousBreakdownWithRs.push({
                month: pb.month,
                amountUSD: pb.amount,
                amountRs: pbResult.baseAmount
            });
        }
      }

      totalCurrentCommission += baseAmount;
      totalPreviousCommission += previousComm;

      addOrUpdateManagerTeam(
        sup.teamId, sup.team.name, 'Supervisor', perf.target, perf.cleared, baseAmount, 0, previousComm, previousBreakdownWithRs, desc
      );
    }
  }

  if (user.assists && user.assists.length > 0) {
    for (const ast of user.assists) {
      const perf = performanceData.find(p => p.teamId === ast.teamId) || { teamId: ast.teamId, teamName: ast.team.name, target: 0, cleared: 0, previousCleared: 0, previousBreakdown: [] };

      const metric = ast.type === 'TARGET' ? perf.target : perf.cleared;
      const { baseAmount, desc } = calculateAmount(metric, ast, 'assistant');
      
      let previousComm = 0;
      const previousBreakdownWithRs: any[] = [];
      if ((perf.previousCleared || 0) > 0 && perf.previousBreakdown) {
        let prevMetric = ast.type === 'TARGET' ? 0 : perf.previousCleared;
        const prevResult = calculateAmount(prevMetric!, ast, 'assistant');
        previousComm = prevResult.baseAmount;
        for (const pb of perf.previousBreakdown) {
            const pbMetric = ast.type === 'TARGET' ? 0 : pb.amount;
            const pbResult = calculateAmount(pbMetric, ast, 'assistant');
            previousBreakdownWithRs.push({
                month: pb.month,
                amountUSD: pb.amount,
                amountRs: pbResult.baseAmount
            });
        }
      }

      totalCurrentCommission += baseAmount;
      totalPreviousCommission += previousComm;

      addOrUpdateManagerTeam(
        ast.teamId, ast.team.name, 'Assistant Team Leader', perf.target, perf.cleared, baseAmount, 0, previousComm, previousBreakdownWithRs, desc
      );
    }
  }

  if (user.name === 'Bilal') {
    const evB = performanceData.find(p => p.teamName === 'Team Umer (Evening - Boys)')?.target || 0;
    const evG = performanceData.find(p => p.teamName === 'Team Umer (Evening - Girls)')?.target || 0;
    const combinedTarget = evB + evG;
    const bonus = Math.floor(combinedTarget / 5000) * 5000;
    
    if (bonus > 0) {
      totalBonus += bonus;
      addOrUpdateManagerTeam(
        'bilal-special', 'Combined EV-B & EV-G', 'Assistant Team Leader (Special Bonus)', combinedTarget, 0, 0, bonus, 0, [], `Combined Target ${combinedTarget} Floored to $5000`
      );
    }
  }

  return {
    userId: user.id,
    userName: user.name,
    totalCurrentCommission,
    totalPreviousCommission,
    totalBonus,
    breakdown,
    managerTeams
  };
}