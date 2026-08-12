'use server'

import { PrismaClient } from '@prisma/client'
import { calculatePayroll } from '@/lib/payroll-engine'

const prisma = new PrismaClient()

export async function getPayrollPreview(monthStr: string) {
  const users = await prisma.user.findMany({
    where: { position: 'Employee' }
  });

  const results = [];
  for (const user of users) {
    try {
      const payroll = await calculatePayroll(user.id, monthStr, 0); // initial 0 allowance
      results.push({ user, payroll });
    } catch (e) {
      // Ignore users without profiles
    }
  }

  return results;
}

export async function lockPayrollMonth(monthStr: string, allowances: Record<string, boolean>) {
  const users = await prisma.user.findMany({
    where: { position: 'Employee' }
  });

  for (const user of users) {
    try {
      const manualAllowance = allowances[user.id] ? 5000 : 0;
      const p = await calculatePayroll(user.id, monthStr, manualAllowance);
      
      // Write to Snapshot
      await prisma.monthlyPayrollSnapshot.upsert({
        where: {
          userId_month: {
            userId: user.id,
            month: monthStr
          }
        },
        create: {
          userId: user.id,
          month: monthStr,
          target: p.target,
          clearedAtClose: p.cleared,
          remaining: p.remaining,
          calculatedSalary: p.calculatedSalary,
          calculatedBonus: p.calculatedBonus,
          allowance: p.allowance,
          commissionEntriesTotal: p.totalCommissionEarned,
          executionManagerCommission: p.totalEMEarned,
          leadershipEarningsTotal: p.totalLeadershipEarned,
          grossTotal: p.grossTotal,
          isLocked: true,
          lockedAt: new Date()
        },
        update: {
          target: p.target,
          clearedAtClose: p.cleared,
          remaining: p.remaining,
          calculatedSalary: p.calculatedSalary,
          calculatedBonus: p.calculatedBonus,
          allowance: p.allowance,
          commissionEntriesTotal: p.totalCommissionEarned,
          executionManagerCommission: p.totalEMEarned,
          leadershipEarningsTotal: p.totalLeadershipEarned,
          grossTotal: p.grossTotal,
          isLocked: true,
          lockedAt: new Date()
        }
      });

      // Write agent true-up ledger entry if owed
      if (p.incrementalCommission !== 0) {
        await prisma.commissionLedgerEntry.create({
          data: {
            earnerId: user.id,
            earningType: 'AGENT_COMMISSION',
            sourceMonth: monthStr,
            payoutMonth: monthStr,
            clearedBefore: p.cleared - (p.incrementalCommission / 40),
            clearedAfter: p.cleared,
            incrementalAmount: p.incrementalCommission
          }
        });
      }
      
      // Write EM true-up ledger entry if owed
      if (p.incrementalEM !== 0) {
        await prisma.commissionLedgerEntry.create({
          data: {
            earnerId: user.id,
            earningType: 'EM_COMMISSION',
            sourceMonth: monthStr,
            payoutMonth: monthStr,
            clearedBefore: p.emCleared, // approx
            clearedAfter: p.emCleared,
            incrementalAmount: p.incrementalEM
          }
        });
      }
      
      // Write TL true-up ledger entry if owed
      if (p.incrementalLeadership !== 0) {
        await prisma.commissionLedgerEntry.create({
          data: {
            earnerId: user.id,
            earningType: 'TEAM_LEADER',
            sourceMonth: monthStr,
            payoutMonth: monthStr,
            clearedBefore: p.teamCleared, // approx
            clearedAfter: p.teamCleared,
            incrementalAmount: p.incrementalLeadership
          }
        });
      }

    } catch (e) {
      // ignore
    }
  }
  
  return { success: true }
}
