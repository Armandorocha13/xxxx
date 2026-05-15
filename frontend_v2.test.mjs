import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

const html = fs.readFileSync(path.resolve(__dirname, './index.html'), 'utf8');

describe('Dashboard V2 Layout Requirements', () => {
  let dom;
  let document;

  beforeEach(() => {
    dom = new JSDOM(html);
    document = dom.window.document;
  });

  it('should have KPIs at the top of the main content area', () => {
    const main = document.querySelector('.main-content');
    const firstSection = main.children[1]; // After header/filters
    expect(firstSection.classList.contains('kpi-row')).toBe(true);
  });

  it('should have charts side-by-side below KPIs', () => {
    const chartsRow = document.querySelector('.charts-row');
    expect(chartsRow).not.toBeNull();
    // In CSS we would check display: grid or flex
  });

  it('should have the table summary at the bottom', () => {
    const main = document.querySelector('.main-content');
    const lastSection = main.lastElementChild;
    expect(lastSection.classList.contains('table-section')).toBe(true);
  });
});
