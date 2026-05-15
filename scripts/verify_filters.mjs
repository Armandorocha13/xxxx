import { getDashboardData } from '../dashboard.mjs';

async function verify() {
  const all = await getDashboardData();
  const tech = all.filters.technicians[0];
  console.log(`Testing filter for technician: ${tech}`);
  
  const filtered = await getDashboardData({ name: tech });
  console.log(`Total rows in summary for ${tech}: ${filtered.summaryTable.length}`);
  const match = filtered.summaryTable.every(r => r.name === tech);
  console.log(`All rows match name? ${match}`);
  
  const base = all.filters.bases[0];
  console.log(`Testing filter for base: ${base}`);
  const filteredBase = await getDashboardData({ base: base });
  console.log(`Base distribution length: ${filteredBase.baseDistribution.length}`);
  console.log(`Base name: ${filteredBase.baseDistribution[0]?.base}`);
}

verify();
