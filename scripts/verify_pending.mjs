import { getDashboardData } from '../dashboard.mjs';

async function verify() {
  const data = await getDashboardData();
  console.log('Verifying table content...');
  // After fix, summaryTable should reflect pending items
  const totalSummaryCount = data.summaryTable.reduce((acc, row) => acc + parseInt(row.count), 0);
  console.log('Total Pending items in summary table:', totalSummaryCount);
  console.log('KPI Pending count:', data.kpis.pending);
  
  // They should be close (KPI is total rows, table is grouped)
}

verify();
