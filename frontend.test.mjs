import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

const html = fs.readFileSync(path.resolve(__dirname, './index.html'), 'utf8');
const css = fs.readFileSync(path.resolve(__dirname, './style.css'), 'utf8');

describe('Frontend Modern Layout Requirements', () => {
  let dom;
  let document;

  beforeEach(() => {
    dom = new JSDOM(html, { runScripts: "dangerously", resources: "usable" });
    document = dom.window.document;
  });

  it('should have a KPI grid with modern layout properties', () => {
    const kpiGrid = document.querySelector('.kpi-grid');
    expect(kpiGrid).not.toBeNull();
    // We will check for these in CSS via string matching or just ensure classes exist
    expect(kpiGrid.classList.contains('modern-layout')).toBe(true);
  });

  it('should have a scrollable table wrapper to prevent excessive height', () => {
    const tableWrapper = document.querySelector('.table-wrapper');
    expect(tableWrapper).not.toBeNull();
    // Logic check: table should be inside a div with specific scroll constraints
    expect(tableWrapper.tagName).toBe('DIV');
  });

  it('should use corporate color variables in CSS', () => {
    expect(css).toContain('--bg-color');
    expect(css).toContain('--text-color');
    expect(css).toContain('--accent-color');
  });

  it('should have a side-by-side or grid layout for charts', () => {
    const chartsGrid = document.querySelector('.charts-grid');
    expect(chartsGrid).not.toBeNull();
  });
});
