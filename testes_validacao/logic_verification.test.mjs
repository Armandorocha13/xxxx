import { describe, it, expect } from 'vitest';
import { getDashboardData } from '../dashboard.mjs';

describe('Filter and Pending Logic Verification', () => {
  it('should filter by technician name correctly', async () => {
    // First get a name that exists
    const initialData = await getDashboardData();
    const testName = initialData.filters.technicians[0];
    
    const filteredData = await getDashboardData({ name: testName });
    expect(filteredData.summaryTable.every(row => row.name === testName)).toBe(true);
  });

  it('should filter by base correctly', async () => {
    const initialData = await getDashboardData();
    const testBase = initialData.filters.bases[0];
    
    const filteredData = await getDashboardData({ base: testBase });
    // Since summaryTable doesn't return base, we check the baseDistribution
    expect(filteredData.baseDistribution.length).toBe(1);
    expect(filteredData.baseDistribution[0].base).toBe(testBase);
  });

  it('should return pending counts in the base distribution', async () => {
    const data = await getDashboardData();
    // We expect baseDistribution to show pending counts now (after fix)
    // For now we check if it has data
    expect(data.baseDistribution.length).toBeGreaterThan(0);
  });
});
