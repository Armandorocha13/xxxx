import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const css = fs.readFileSync(path.resolve(__dirname, './style.css'), 'utf8');

describe('Dashboard Layout CSS Requirements V4', () => {
  it('should use flexbox for horizontal alignment of KPIs', () => {
    expect(css).toMatch(/\.kpi-row\s*{[^}]*display:\s*flex/);
    expect(css).toMatch(/\.kpi-row\s*{[^}]*gap:\s*1rem/);
  });

  it('should use flexbox or grid for horizontal alignment of charts', () => {
    expect(css).toMatch(/\.charts-row\s*{[^}]*display:\s*grid/);
    expect(css).toMatch(/\.charts-row\s*{[^}]*grid-template-columns:\s*1fr\s*1fr/);
  });
});
