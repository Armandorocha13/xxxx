import { describe, it, expect } from 'vitest';
import { getDashboardData } from '../dashboard.mjs';

describe('Dashboard Backend Dropdown Data', () => {
  it('should return unique lists for filters', async () => {
    const data = await getDashboardData();
    expect(data).toHaveProperty('filters');
    expect(data.filters).toHaveProperty('technicians');
    expect(data.filters).toHaveProperty('bases');
    expect(data.filters).toHaveProperty('materials');
    expect(Array.isArray(data.filters.technicians)).toBe(true);
  });
});
