import { describe, it, expect } from 'vitest';
import { getDashboardData } from '../dashboard.mjs';

describe('Dashboard Data Logic', () => {
  it('should return KPI data with accepted and pending counts', async () => {
    const data = await getDashboardData();
    expect(data.kpis).toBeDefined();
    expect(data.kpis.accepted).toBeGreaterThanOrEqual(0);
    expect(data.kpis.pending).toBeGreaterThanOrEqual(0);
  });

  it('should return top 5 pending technicians', async () => {
    const data = await getDashboardData();
    expect(data.topPending).toBeDefined();
    expect(data.topPending.length).toBeLessThanOrEqual(5);
    if (data.topPending.length > 0) {
      expect(data.topPending[0]).toHaveProperty('name');
      expect(data.topPending[0]).toHaveProperty('count');
    }
  });

  it('should return base distribution for the donut chart', async () => {
    const data = await getDashboardData();
    expect(data.baseDistribution).toBeDefined();
    if (data.baseDistribution.length > 0) {
      expect(data.baseDistribution[0]).toHaveProperty('base');
      expect(data.baseDistribution[0]).toHaveProperty('count');
    }
  });

  it('should apply filters for name and material', async () => {
    const filters = { name: 'TEST_NAME', material: 'TEST_MATERIAL' };
    const data = await getDashboardData(filters);
    // Even if no data matches, the structure should be correct
    expect(data.summaryTable).toBeDefined();
  });
});
