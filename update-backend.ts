import * as fs from 'fs';

let content = fs.readFileSync('src/app/portal/admin/monthly-salaries.ts', 'utf8');

// 1. Add emPerf map and modify addPerf
let addPerfOriginal = `    const teamPerf = new Map<string, { target: number, cleared: number, previousCleared: number, previousBreakdown: { month: string, amount: number }[] }>();
    const userPerf = new Map<string, { target: number, cleared: number, previousCleared: number, previousBreakdown: { month: string, amount: number }[] }>();

    const addPerf = (teamId: string, userId: string, target: number, cleared: number, isPrevious: boolean = false, creationMonth: string = '') => {`;

let addPerfNew = `    const teamPerf = new Map<string, { target: number, cleared: number, previousCleared: number, previousBreakdown: { month: string, amount: number }[] }>();
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
      }`;

content = content.replace(addPerfOriginal, addPerfNew);

// 2. Replace addPerf calls
content = content.replace(`addPerf(s.teamId, s.agentId, s.targetAmount, clearedAmt);`, `addPerf(s, s.targetAmount, clearedAmt);`);
content = content.replace(`addPerf(s.teamId, s.agentId, 0, remainingBalance, true, creationMonth);`, `addPerf(s, 0, remainingBalance, true, creationMonth);`);

// 3. Add emTeams logic inside the map
let salariesStartOriginal = `      let previousBreakdownWithRs: { month: string, amountUSD: number, amountRs: number }[] = [];
      let managerTeams: any[] = [];`;

let salariesStartNew = `      let previousBreakdownWithRs: { month: string, amountUSD: number, amountRs: number }[] = [];
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
      }`;

content = content.replace(salariesStartOriginal, salariesStartNew);

// 4. Return emTeams
content = content.replace(`managerTeams,\n        total`, `managerTeams,\n        emTeams,\n        total`);

fs.writeFileSync('src/app/portal/admin/monthly-salaries.ts', content);
