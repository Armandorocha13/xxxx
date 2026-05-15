/**
 * Repositório de Aceites (Camada de Acesso a Dados)
 * ====================================================
 * Responsável exclusivamente pelas consultas SQL ao banco Neon.
 * Seguindo o padrão Repository da Arquitetura Limpa.
 */

import { neon } from '@neondatabase/serverless';
import { configuracoes } from '../configuracoes/configuracao_global.mjs';

const sql = neon(configuracoes.urlBancoDados);

/**
 * Constrói a cláusula WHERE com base nos filtros fornecidos.
 * @param {Object} filtros - { nome, material, base }
 * @returns {{ sqlFiltro: string, parametros: Array }}
 */
function construirFiltros(filtros = {}) {
  const { nome, material, base } = filtros;
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

  return { sqlFiltro, parametros };
}

/** Condição SQL para identificar aceites pendentes */
const CONDICAO_PENDENTE = `(aceite_destinatario = 'Sem resposta' OR aceite_destinatario IS NULL OR aceite_destinatario = '')`;

/**
 * Busca os KPIs de aceitos vs pendentes.
 */
export async function buscarKpis(filtros = {}) {
  const { sqlFiltro, parametros } = construirFiltros(filtros);
  const resultado = await sql.query(`
    SELECT
      COUNT(*) FILTER (WHERE aceite_destinatario = 'Aceito') AS aceitos,
      COUNT(*) FILTER (WHERE ${CONDICAO_PENDENTE}) AS pendentes
    FROM movimentacao_tecnico
    WHERE 1=1 ${sqlFiltro}
  `, parametros);
  const linhas = resultado.rows || resultado;
  return {
    aceitos: parseInt(linhas[0]?.aceitos || 0),
    pendentes: parseInt(linhas[0]?.pendentes || 0),
  };
}

/**
 * Busca o Top 5 técnicos com mais aceites pendentes.
 */
export async function buscarTopPendentes(filtros = {}) {
  const { sqlFiltro, parametros } = construirFiltros(filtros);
  const resultado = await sql.query(`
    SELECT recebido_por AS nome, COUNT(*) AS total
    FROM movimentacao_tecnico
    WHERE ${CONDICAO_PENDENTE} ${sqlFiltro}
    GROUP BY recebido_por
    ORDER BY total DESC
    LIMIT 5
  `, parametros);
  return resultado.rows || resultado;
}

/**
 * Busca a distribuição de pendências por base.
 */
export async function buscarDistribuicaoPorBase(filtros = {}) {
  const { sqlFiltro, parametros } = construirFiltros(filtros);
  const resultado = await sql.query(`
    SELECT base, COUNT(*) AS total
    FROM movimentacao_tecnico
    WHERE ${CONDICAO_PENDENTE} ${sqlFiltro}
    GROUP BY base
    ORDER BY total DESC
  `, parametros);
  return resultado.rows || resultado;
}

/**
 * Busca a tabela detalhada de pendências por técnico e material.
 */
export async function buscarTabelaDetalhada(filtros = {}) {
  const { sqlFiltro, parametros } = construirFiltros(filtros);
  const resultado = await sql.query(`
    SELECT
      recebido_por AS nome,
      miscelanea AS material,
      COUNT(*) AS total
    FROM movimentacao_tecnico
    WHERE ${CONDICAO_PENDENTE} ${sqlFiltro}
    GROUP BY recebido_por, miscelanea
    ORDER BY total DESC
    LIMIT ${configuracoes.limiteTabela}
  `, parametros);
  return resultado.rows || resultado;
}

/**
 * Busca os valores únicos para popular os menus suspensos.
 */
export async function buscarListasFiltros() {
  const [tecnicos, bases, materiais] = await Promise.all([
    sql.query(`SELECT DISTINCT recebido_por FROM movimentacao_tecnico WHERE recebido_por IS NOT NULL ORDER BY recebido_por`),
    sql.query(`SELECT DISTINCT base FROM movimentacao_tecnico WHERE base IS NOT NULL ORDER BY base`),
    sql.query(`SELECT DISTINCT miscelanea FROM movimentacao_tecnico WHERE miscelanea IS NOT NULL ORDER BY miscelanea`),
  ]);
  return {
    tecnicos: (tecnicos.rows || tecnicos).map(r => r.recebido_por),
    bases: (bases.rows || bases).map(r => r.base),
    materiais: (materiais.rows || materiais).map(r => r.miscelanea),
  };
}
