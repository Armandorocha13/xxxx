import { describe, it, expect, beforeAll } from 'vitest';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

const html = fs.readFileSync(path.resolve(__dirname, '../apresentacao/paginas_web/index.html'), 'utf8');

describe('Refatoração Profissional do Layout (TDD)', () => {
  let dom, document;

  beforeAll(() => {
    dom = new JSDOM(html);
    document = dom.window.document;
  });

  it('deve ter os filtros em uma posição de destaque (topo ou sidebar)', () => {
    const filtrosSection = document.querySelector('section[aria-label="Filtros"]');
    expect(filtrosSection).not.toBeNull();
  });

  it('a tabela deve vir ANTES dos gráficos na estrutura do documento', () => {
    const main = document.querySelector('main');
    const sections = Array.from(main.querySelectorAll('section'));
    
    const indexTabela = sections.findIndex(s => s.getAttribute('aria-label')?.includes('Tabela'));
    const indexGraficos = sections.findIndex(s => s.getAttribute('aria-label')?.includes('Gráficos'));
    
    expect(indexTabela).toBeLessThan(indexGraficos);
    expect(indexTabela).toBeGreaterThan(-1);
    expect(indexGraficos).toBeGreaterThan(-1);
  });

  it('deve possuir uma estrutura de layout moderna (ex: sidebar ou container profissional)', () => {
    const layout = document.querySelector('.layout');
    expect(layout).not.toBeNull();
  });
});
