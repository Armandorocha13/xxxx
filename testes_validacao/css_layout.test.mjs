import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const css = fs.readFileSync(path.resolve(__dirname, '..', 'style.css'), 'utf8');

describe('Dashboard Layout CSS Requirements', () => {
  it('should have a horizontal KPI row with multiple columns', () => {
    // Regex to check if .kpi-row has grid-template-columns: repeat(2, ...) or similar
    expect(css).toMatch(/\.kpi-row\s*{[^}]*grid-template-columns:\s*repeat\(2,\s*1fr\)/);
  });

  it('should have a horizontal charts row with multiple columns', () => {
    expect(css).toMatch(/\.charts-row\s*{[^}]*grid-template-columns:\s*1fr\s*1fr/);
  });

  it('should have more compact KPI cards', () => {
    // Check if padding is reduced or height is limited
    expect(css).toMatch(/\.kpi-card\s*{[^}]*padding:\s*1rem/); // Expecting 1rem instead of 2rem
  });
});
