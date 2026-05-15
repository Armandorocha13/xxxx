/**
 * Lógica de Negócio para o Dashboard de Aceites
 * Este módulo contém as funções de consulta ao banco de dados Neon.
 */
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();
const sql = neon(process.env.DATABASE_URL);

/**
 * Busca dados filtrados para o dashboard.
 * @param {Object} filtros - Filtros de nome, material e base.
 * @returns {Promise<Object>} Dados processados para KPIs, gráficos e tabela.
 */
export async function buscarDadosDashboard(filtros = {}) {
  const { nome, material, base } = filtros;
  
  // Construção dinâmica da cláusula WHERE
  let sqlFiltro = '';
  const parametros = [];
  
  if (nome && nome !== 'all') {
    parametros.push(nome);
    sqlFiltro += ` AND recebido_por = $${parametros.length}`;
  }
  if (material && material !== 'all') {
    parametros.push(material);
    sqlFiltro += ` AND miscelanea = $${parametros.length}`;
  }
  if (base && base !== 'all') {
    parametros.push(base);
    sqlFiltro += ` AND base = $${parametros.length}`;
  }

  // Filtro base para pendências: 'Sem resposta' ou vazio
  const sqlPendentes = `(aceite_destinatario = 'Sem resposta' OR aceite_destinatario IS NULL OR aceite_destinatario = '')`;

  // 1. Cálculo de KPIs (Aceitos vs Pendentes)
  const resultadoKpis = await sql.query(`
    SELECT 
      COUNT(*) FILTER (WHERE aceite_destinatario = 'Aceito') as aceitos,
      COUNT(*) FILTER (WHERE ${sqlPendentes}) as pendentes
    FROM movimentacao_tecnico
    WHERE 1=1 ${sqlFiltro}
  `, parametros);

  // 2. Top 5 Técnicos com mais pendências
  const resultadoTopPendentes = await sql.query(`
    SELECT recebido_por as nome, COUNT(*) as total
    FROM movimentacao_tecnico
    WHERE ${sqlPendentes}
    ${sqlFiltro}
    GROUP BY recebido_por
    ORDER BY total DESC
    LIMIT 5
  `, parametros);

  // 3. Distribuição de pendências por Base
  const resultadoBaseDist = await sql.query(`
    SELECT base, COUNT(*) as total
    FROM movimentacao_tecnico
    WHERE ${sqlPendentes}
    ${sqlFiltro}
    GROUP BY base
    ORDER BY total DESC
  `, parametros);

  // 4. Tabela de Resumo (Listagem de Pendências)
  const resultadoTabela = await sql.query(`
    SELECT 
      recebido_por as nome, 
      miscelanea as material, 
      COUNT(*) as total
    FROM movimentacao_tecnico
    WHERE ${sqlPendentes}
    ${sqlFiltro}
    GROUP BY recebido_por, miscelanea
    ORDER BY total DESC
    LIMIT 1000
  `, parametros);

  // 5. Listas para os filtros (Menus suspensos)
  const [listaTecnicos, listaBases, listaMateriais] = await Promise.all([
    sql.query(`SELECT DISTINCT recebido_por FROM movimentacao_tecnico WHERE recebido_por IS NOT NULL ORDER BY recebido_por`),
    sql.query(`SELECT DISTINCT base FROM movimentacao_tecnico WHERE base IS NOT NULL ORDER BY base`),
    sql.query(`SELECT DISTINCT miscelanea FROM movimentacao_tecnico WHERE miscelanea IS NOT NULL ORDER BY miscelanea`)
  ]);

  const linhasKpis = resultadoKpis.rows || resultadoKpis;
  const linhasTop = resultadoTopPendentes.rows || resultadoTopPendentes;
  const linhasBase = resultadoBaseDist.rows || resultadoBaseDist;
  const linhasTabela = resultadoTabela.rows || resultadoTabela;

  return {
    kpis: {
      aceitos: parseInt(linhasKpis[0]?.aceitos || 0),
      pendentes: parseInt(linhasKpis[0]?.pendentes || 0)
    },
    top_pendentes: linhasTop,
    distribuicao_base: linhasBase,
    tabela_resumo: linhasTabela,
    listas_filtros: {
      tecnicos: (listaTecnicos.rows || listaTecnicos).map(r => r.recebido_por),
      bases: (listaBases.rows || listaBases).map(r => r.base),
      materiais: (listaMateriais.rows || listaMateriais).map(r => r.miscelanea)
    }
  };
}
