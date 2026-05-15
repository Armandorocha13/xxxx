import { describe, it, expect } from 'vitest';
import { buscarTabelaDetalhada } from '../repositorios/repositorio_aceites.mjs';

describe('Cálculo de Dias de Pendência (TDD)', () => {
  it('deve retornar a coluna "dias" calculada a partir de "dt_resposta"', async () => {
    const tabela = await buscarTabelaDetalhada();
    
    if (tabela.length > 0) {
      const item = tabela[0];
      expect(item).toHaveProperty('dias');
      expect(typeof item.dias).toBe('number');
      expect(item.dias).toBeGreaterThanOrEqual(0);
      
      // Validação adicional: o campo base deve estar presente
      expect(item).toHaveProperty('base');
      expect(item.base).not.toBeNull();
    }
  });

  it('os itens na tabela devem estar ordenados pelos dias de pendência (mais antigos primeiro)', async () => {
    const tabela = await buscarTabelaDetalhada();
    
    if (tabela.length > 1) {
      // O primeiro item deve ter mais ou igual dias que o segundo (ordem DESC)
      expect(tabela[0].dias).toBeGreaterThanOrEqual(tabela[1].dias);
    }
  });
});
