import { describe, it, expect } from 'vitest';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

// Simular ambiente de navegador para testar estrutura HTML
const html = fs.readFileSync(path.resolve('apresentacao/paginas_web/index.html'), 'utf8');
const dom = new JSDOM(html);
const { document } = dom.window;

describe('TDD: Filtro de Status de Aceite', () => {
    
    it('deve possuir um select de status com as opções Aceito e Pendente', () => {
        const selectStatus = document.getElementById('filtro-status');
        expect(selectStatus).not.toBeNull();
        
        const options = Array.from(selectStatus.options).map(opt => opt.value);
        expect(options).toContain('Aceito');
        expect(options).toContain('Pendente');
        expect(options).toContain('all'); // Opção padrão
    });

    it('deve ter um label associado ao filtro de status', () => {
        const label = document.querySelector('label[for="filtro-status"]');
        expect(label).not.toBeNull();
        expect(label.textContent).toContain('STATUS');
    });
});
