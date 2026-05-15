/**
 * Caso de Uso: Buscar Dados do Dashboard
 * =========================================
 * Orquestra as chamadas ao repositório e compõe o objeto de resposta
 * para o dashboard. Esta camada não conhece detalhes de banco de dados.
 * Seguindo o padrão Use Case da Arquitetura Limpa.
 */

import {
  buscarKpis,
  buscarTopPendentes,
  buscarDistribuicaoPorBase,
  buscarTabelaDetalhada,
  buscarListasFiltros,
} from '../repositorios/repositorio_aceites.mjs';

/**
 * Executa todas as consultas necessárias para o dashboard e retorna
 * um único objeto consolidado para o controller da API.
 *
 * @param {Object} filtros - { nome, material, base }
 * @returns {Promise<Object>} Dados completos do dashboard
 */
export async function executarBuscarDadosDashboard(filtros = {}) {
  // Executa consultas em paralelo para melhor performance
  const [kpis, topPendentes, distribuicaoBase, tabelaDetalhada, listasFiltros] =
    await Promise.all([
      buscarKpis(filtros),
      buscarTopPendentes(filtros),
      buscarDistribuicaoPorBase(filtros),
      buscarTabelaDetalhada(filtros),
      buscarListasFiltros(),
    ]);

  return {
    kpis,
    top_pendentes: topPendentes,
    distribuicao_base: distribuicaoBase,
    tabela_resumo: tabelaDetalhada,
    listas_filtros: listasFiltros,
  };
}
