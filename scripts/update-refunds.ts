import * as fs from 'fs';

let content = fs.readFileSync('src/app/portal/admin/monthly-salaries.ts', 'utf8');

const originalClearedBlock = `    monthSalesCleared.forEach(s => {
      const creationMonth = s.createdAt.toISOString().substring(0, 7);
      const paymentsInCreationMonth = s.payments.filter(p => p.recordedAt.toISOString().substring(0, 7) === creationMonth).reduce((sum, p) => sum + p.amount, 0);
      const remainingBalance = s.targetAmount - paymentsInCreationMonth;
      addPerf(s, 0, remainingBalance, true, creationMonth);
    });`;

const newBlock = `    monthSalesCleared.forEach(s => {
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
    });`;

if (content.includes(originalClearedBlock)) {
    content = content.replace(originalClearedBlock, newBlock);
    fs.writeFileSync('src/app/portal/admin/monthly-salaries.ts', content);
    console.log('Successfully updated monthly-salaries.ts with refund logic');
} else {
    console.log('Could not find original block to replace');
}
