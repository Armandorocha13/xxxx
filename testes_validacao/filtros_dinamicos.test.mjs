import { describe, it, expect } from 'vitest';
import { buscarListasFiltros } from '../repositorios/repositorio_aceites.mjs';

describe('Filtros Dinâmicos no Repositório', () => {
  it('deve retornar todos os técnicos quando nenhum filtro é aplicado', async () => {
    const listas = await buscarListasFiltros();
    expect(listas.tecnicos).toBeDefined();
    expect(listas.tecnicos.length).toBeGreaterThan(0);
  });

  it('deve retornar campos base e dias na tabela detalhada', async () => {
    const { buscarTabelaDetalhada } = await import('../repositorios/repositorio_aceites.mjs');
    const tabela = await buscarTabelaDetalhada();
    if (tabela.length > 0) {
      expect(tabela[0]).toHaveProperty('base');
      expect(tabela[0]).toHaveProperty('dias');
      expect(typeof tabela[0].dias).toBe('number');
    }
  });

  it('deve filtrar a lista de técnicos ao selecionar uma base específica', async () => {
    // 1. Pega uma base existente para o teste
    const listasIniciais = await buscarListasFiltros();
    if (listasIniciais.bases.length < 2) return; // Precisa de pelo menos 2 bases para o teste ser válido
    
    const baseTeste = listasIniciais.bases[0];
    
    // 2. Busca técnicos filtrados por essa base
    const listasFiltradas = await buscarListasFiltros({ base: baseTeste });
    
    // 3. Valida se a lista de técnicos mudou (deve ser menor que o total em um cenário real)
    expect(listasFiltradas.tecnicos.length).toBeLessThan(listasIniciais.tecnicos.length);
  });

  it('deve manter a lista de bases completa mesmo ao filtrar por base (para permitir trocar)', async () => {
    const listasIniciais = await buscarListasFiltros();
    if (listasIniciais.bases.length === 0) return;
    
    const baseTeste = listasIniciais.bases[0];
    const listasFiltradas = await buscarListasFiltros({ base: baseTeste });
    
    expect(listasFiltradas.bases.length).toBe(listasIniciais.bases.length);
  });
});
