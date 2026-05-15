import { getDashboardData } from '../dashboard.mjs';

async function test() {
  const data = await getDashboardData();
  console.log('KPIs:', data.kpis);
  console.log('Top Pending:', data.topPending.slice(0, 2));
}

test();
