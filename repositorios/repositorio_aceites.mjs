/**
 * Repositório de Aceites (Camada de Acesso a Dados)
 * ====================================================
 * Responsável exclusivamente pelas consultas SQL ao banco Neon.
 * Seguindo o padrão Repository da Arquitetura Limpa.
 */

import { neon } from '@neondatabase/serverless';
import { configuracoes } from '../configuracoes/configuracao_global.mjs';

const sql = neon(configuracoes.urlBancoDados);

/** Condição SQL para identificar aceites pendentes */
const CONDICAO_PENDENTE = `(aceite_destinatario = 'Sem resposta' OR aceite_destinatario IS NULL OR aceite_destinatario = '' OR aceite_destinatario = 'Pendente')`;

/**
 * Constrói a cláusula WHERE com base nos filtros fornecidos.
 */
function construirFiltros(filtros = {}) {
  const { nome, material, base, status } = filtros;
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

  // Lógica dinâmica de Status
  if (status === 'Aceito') {
    sqlFiltro += ` AND aceite_destinatario = 'Aceito'`;
  } else if (status === 'Pendente') {
    sqlFiltro += ` AND ${CONDICAO_PENDENTE}`;
  }
  // Se for 'all', não adiciona filtro de status (mostra tudo)

  return { sqlFiltro, parametros };
}

/**
 * Busca os KPIs de aceitos vs pendentes.
 */
export async function buscarKpis(filtros = {}) {
  // KPIs sempre mostram totais globais respeitando apenas filtros de base/nome/material
  // Ignoramos o filtro de status aqui para os KPIs serem consistentes
  const { sqlFiltro, parametros } = construirFiltros({ ...filtros, status: 'all' });
  
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
 * Busca o Top 5 técnicos com mais pendências (ou aceitos se o filtro mudar).
 */
export async function buscarTopPendentes(filtros = {}) {
  // Se o usuário não filtrou status, mostramos pendentes por padrão no Top 5
  const statusEfetivo = filtros.status && filtros.status !== 'all' ? filtros.status : 'Pendente';
  const { sqlFiltro, parametros } = construirFiltros({ ...filtros, status: statusEfetivo });
  
  const resultado = await sql.query(`
    SELECT recebido_por AS nome, COUNT(*) AS total
    FROM movimentacao_tecnico
    WHERE 1=1 ${sqlFiltro}
    GROUP BY recebido_por
    ORDER BY total DESC
    LIMIT 5
  `, parametros);
  return resultado.rows || resultado;
}

/**
 * Busca a distribuição por base.
 */
export async function buscarDistribuicaoPorBase(filtros = {}) {
  const statusEfetivo = filtros.status && filtros.status !== 'all' ? filtros.status : 'Pendente';
  const { sqlFiltro, parametros } = construirFiltros({ ...filtros, status: statusEfetivo });

  const resultado = await sql.query(`
    SELECT base, COUNT(*) AS total
    FROM movimentacao_tecnico
    WHERE 1=1 ${sqlFiltro}
    GROUP BY base
    ORDER BY total DESC
  `, parametros);
  return resultado.rows || resultado;
}

/**
 * Busca a tabela detalhada.
 */
export async function buscarTabelaDetalhada(filtros = {}) {
  const { sqlFiltro, parametros } = construirFiltros(filtros);
  
  const resultado = await sql.query(`
    SELECT
      recebido_por AS nome,
      miscelanea AS material,
      base,
      aceite_destinatario AS status_item,
      MAX(DATE_PART('day', NOW() - COALESCE(NULLIF(dt_resposta, ''), dt_solicitacao)::timestamp)) AS dias,
      COUNT(*) AS total
    FROM movimentacao_tecnico
    WHERE 1=1 ${sqlFiltro}
    GROUP BY recebido_por, miscelanea, base, aceite_destinatario
    ORDER BY dias DESC, total DESC
    LIMIT ${configuracoes.limiteTabela}
  `, parametros);
  return (resultado.rows || resultado).map(r => ({
    ...r,
    dias: Math.floor(r.dias || 0)
  }));
}

/**
 * Busca os valores únicos para popular os menus suspensos.
 * Permite filtrar técnicos por base, etc.
 * @param {Object} filtros - Filtros atuais para restringir as listas
 */
export async function buscarListasFiltros(filtros = {}) {
  const { sqlFiltro, parametros } = construirFiltros(filtros);
  
  // Para a lista de técnicos, aplicamos os filtros (ex: base)
  // Mas para a lista de bases, queremos sempre todas (para o usuário poder mudar)
  const [tecnicos, bases, materiais] = await Promise.all([
    sql.query(`SELECT DISTINCT recebido_por FROM movimentacao_tecnico WHERE recebido_por IS NOT NULL ${sqlFiltro} ORDER BY recebido_por`, parametros),
    sql.query(`SELECT DISTINCT base FROM movimentacao_tecnico WHERE base IS NOT NULL ORDER BY base`),
    sql.query(`SELECT DISTINCT miscelanea FROM movimentacao_tecnico WHERE miscelanea IS NOT NULL ${sqlFiltro} ORDER BY miscelanea`, parametros),
  ]);

  return {
    tecnicos: (tecnicos.rows || tecnicos).map(r => r.recebido_por),
    bases: (bases.rows || bases).map(r => r.base),
    materiais: (materiais.rows || materiais).map(r => r.miscelanea),
  };
}
