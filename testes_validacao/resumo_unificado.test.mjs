import { describe, it, expect } from 'vitest';
import { buscarResumoUnificado } from '../repositorios/repositorio_aceites.mjs';

describe('TDD: Aba Resumo Unificado (EMIS + ETER)', () => {
  
  it('deve retornar um array de tecnicos com pendencias unificadas', async () => {
    try {
      const dados = await buscarResumoUnificado();
      expect(Array.isArray(dados)).toBe(true);
    } catch (erro) {
      console.error("Erro no teste TDD (Aba Resumo):", erro);
      throw erro;
    }
  });

  it('deve possuir os campos obrigatorios: nome, emis_materiais, eter_materiais, emis_dias, eter_dias, emis_qtd, eter_qtd, total_qtd, dias_max', async () => {
    const dados = await buscarResumoUnificado();
    
    if (dados.length > 0) {
      const primeiro = dados[0];
      expect(primeiro).toHaveProperty('nome');
      expect(primeiro).toHaveProperty('emis_materiais');
      expect(primeiro).toHaveProperty('eter_materiais');
      expect(primeiro).toHaveProperty('emis_dias');
      expect(primeiro).toHaveProperty('eter_dias');
      expect(primeiro).toHaveProperty('emis_qtd');
      expect(primeiro).toHaveProperty('eter_qtd');
      expect(primeiro).toHaveProperty('total_qtd');
      expect(primeiro).toHaveProperty('dias_max');
      expect(primeiro).toHaveProperty('bases');

      // Validar tipos
      expect(typeof primeiro.nome).toBe('string');
      expect(typeof primeiro.emis_materiais).toBe('string');
      expect(typeof primeiro.eter_materiais).toBe('string');
      expect(typeof primeiro.emis_dias).toBe('number');
      expect(typeof primeiro.eter_dias).toBe('number');
      expect(typeof primeiro.emis_qtd).toBe('number');
      expect(typeof primeiro.eter_qtd).toBe('number');
      expect(typeof primeiro.total_qtd).toBe('number');
      expect(typeof primeiro.dias_max).toBe('number');
      expect(typeof primeiro.bases).toBe('string');
    }
  });
});
