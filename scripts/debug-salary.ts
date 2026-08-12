import { getMonthlySalaries } from './src/app/portal/admin/monthly-salaries';

async function main() {
  const data = await getMonthlySalaries();
  const june = data.find(m => m.month === '2026-06');
  if (!june) {
    console.log("No June data");
    return;
  }
  const talha = (june as any).executionManagers?.find((e: any) => e.name.includes('Talha'));
  console.log(JSON.stringify(talha, null, 2));
}

main();
