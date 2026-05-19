/**
 * Repositório de Aceites (Camada de Acesso a Dados)
 * ====================================================
 */

import { neon } from '@neondatabase/serverless';
import { configuracoes } from '../configuracoes/configuracao_global.mjs';

const sql = neon(configuracoes.urlBancoDados);

/** Configurações específicas por projeto */
const CONFIG_PROJETOS = {
  EMIS: {
    tabela: 'movimentacao_tecnico',
    colunas: {
      tecnico: 'recebido_por',
      material: 'miscelanea',
      base: 'base',
      status: 'aceite_destinatario',
      data: "COALESCE(NULLIF(dt_resposta, ''), dt_solicitacao)::timestamp"
    },
    condicao_pendente: `(aceite_destinatario = 'Sem resposta' OR aceite_destinatario IS NULL OR aceite_destinatario = '' OR aceite_destinatario = 'Pendente')`
  },
  ETER: {
    tabela: 'relatorio_equipamento',
    colunas: {
      tecnico: 'tecnico',
      material: 'descricao',
      base: 'cidade',
      status: 'status', 
      data: "to_timestamp(NULLIF(data_alteracao, ''), 'DD/MM/YYYY')"
    },
    // No ETER, o usuário disse que tudo é pendente ("confirmação do técnico")
    condicao_pendente: `1=1` 
  }
};

/**
 * Constrói a cláusula WHERE com base nos filtros fornecidos.
 */
function construirFiltros(filtros = {}) {
  const projeto = filtros.projeto === 'ETER' ? 'ETER' : 'EMIS';
  const config = CONFIG_PROJETOS[projeto];
  const { nome, material, base, status } = filtros;
  
  let sqlFiltro = '';
  const parametros = [];

  if (nome && nome !== 'all') {
    parametros.push(nome);
    sqlFiltro += ` AND ${config.colunas.tecnico} = $${parametros.length}`;
  }
  if (material && material !== 'all') {
    parametros.push(material);
    sqlFiltro += ` AND ${config.colunas.material} = $${parametros.length}`;
  }
  if (base && base !== 'all') {
    parametros.push(base);
    sqlFiltro += ` AND ${config.colunas.base} = $${parametros.length}`;
  }

  // Filtro de Status (Apenas faz sentido real no EMIS, no ETER é informativo)
  if (projeto === 'EMIS') {
    if (status === 'Aceito') {
      sqlFiltro += ` AND ${config.colunas.status} = 'Aceito'`;
    } else if (status === 'Pendente') {
      sqlFiltro += ` AND ${config.condicao_pendente}`;
    }
  }

  return { sqlFiltro, parametros, config };
}

export async function buscarKpis(filtros = {}) {
  const { sqlFiltro, parametros, config } = construirFiltros({ ...filtros, status: 'all' });
  
  // No ETER, o total pendente é o total da tabela
  const query = config.tabela === 'relatorio_equipamento' 
    ? `SELECT 0 AS aceitos, COUNT(*) AS pendentes FROM ${config.tabela} WHERE 1=1 ${sqlFiltro}`
    : `SELECT 
         COUNT(*) FILTER (WHERE ${config.colunas.status} = 'Aceito') AS aceitos,
         COUNT(*) FILTER (WHERE ${config.condicao_pendente}) AS pendentes
       FROM ${config.tabela}
       WHERE 1=1 ${sqlFiltro}`;

  const resultado = await sql.query(query, parametros);
  const linhas = resultado.rows || resultado;
  return {
    aceitos: parseInt(linhas[0]?.aceitos || 0),
    pendentes: parseInt(linhas[0]?.pendentes || 0),
  };
}

export async function buscarTopPendentes(filtros = {}) {
  const projeto = filtros.projeto === 'ETER' ? 'ETER' : 'EMIS';
  const statusEfetivo = projeto === 'EMIS' ? (filtros.status && filtros.status !== 'all' ? filtros.status : 'Pendente') : 'all';
  const { sqlFiltro, parametros, config } = construirFiltros({ ...filtros, status: statusEfetivo });
  
  const resultado = await sql.query(`
    SELECT ${config.colunas.tecnico} AS nome, COUNT(*) AS total
    FROM ${config.tabela}
    WHERE 1=1 ${sqlFiltro}
    GROUP BY ${config.colunas.tecnico}
    ORDER BY total DESC
    LIMIT 5
  `, parametros);
  return resultado.rows || resultado;
}

export async function buscarDistribuicaoPorBase(filtros = {}) {
  const projeto = filtros.projeto === 'ETER' ? 'ETER' : 'EMIS';
  const statusEfetivo = projeto === 'EMIS' ? (filtros.status && filtros.status !== 'all' ? filtros.status : 'Pendente') : 'all';
  const { sqlFiltro, parametros, config } = construirFiltros({ ...filtros, status: statusEfetivo });

  const resultado = await sql.query(`
    SELECT ${config.colunas.base} AS base, COUNT(*) AS total
    FROM ${config.tabela}
    WHERE 1=1 ${sqlFiltro}
    GROUP BY ${config.colunas.base}
    ORDER BY total DESC
  `, parametros);
  return resultado.rows || resultado;
}

export async function buscarTabelaDetalhada(filtros = {}) {
  const { sqlFiltro, parametros, config } = construirFiltros(filtros);
  
  const resultado = await sql.query(`
    SELECT
      ${config.colunas.tecnico} AS nome,
      ${config.colunas.material} AS material,
      ${config.colunas.base} AS base,
      ${config.colunas.status} AS status_item,
      MAX(DATE_PART('day', NOW() - ${config.colunas.data})) AS dias,
      COUNT(*) AS total
    FROM ${config.tabela}
    WHERE 1=1 ${sqlFiltro}
    GROUP BY ${config.colunas.tecnico}, ${config.colunas.material}, ${config.colunas.base}, ${config.colunas.status}
    ORDER BY dias DESC, total DESC
    LIMIT ${configuracoes.limiteTabela}
  `, parametros);
  return (resultado.rows || resultado).map(r => ({
    ...r,
    dias: Math.floor(r.dias || 0)
  }));
}

export async function buscarListasFiltros(filtros = {}) {
  // Para listas, usamos os nomes de colunas dinâmicos
  const { sqlFiltro, parametros, config } = construirFiltros(filtros);
  
  const [tecnicos, bases, materiais] = await Promise.all([
    sql.query(`SELECT DISTINCT ${config.colunas.tecnico} FROM ${config.tabela} WHERE ${config.colunas.tecnico} IS NOT NULL ${sqlFiltro} ORDER BY ${config.colunas.tecnico}`, parametros),
    sql.query(`SELECT DISTINCT ${config.colunas.base} FROM ${config.tabela} WHERE ${config.colunas.base} IS NOT NULL ORDER BY ${config.colunas.base}`),
    sql.query(`SELECT DISTINCT ${config.colunas.material} FROM ${config.tabela} WHERE ${config.colunas.material} IS NOT NULL ${sqlFiltro} ORDER BY ${config.colunas.material}`, parametros),
  ]);

  return {
    tecnicos: (tecnicos.rows || tecnicos).map(r => r[config.colunas.tecnico]),
    bases: (bases.rows || bases).map(r => r[config.colunas.base]),
    materiais: (materiais.rows || materiais).map(r => r[config.colunas.material]),
  };
}

export async function buscarUltimaAtualizacao(filtros = {}) {
  const projeto = filtros.projeto === 'ETER' ? 'ETER' : 'EMIS';
  const config = CONFIG_PROJETOS[projeto];
  
  try {
    const resultado = await sql.query(`SELECT MAX(data_importacao) AS ultima_atualizacao FROM ${config.tabela}`);
    const data = (resultado.rows || resultado)[0]?.ultima_atualizacao;
    
    if (!data) return 'Sem dados importados';
    
    return new Date(data).toLocaleString('pt-BR', { 
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  } catch (err) {
    console.error('Erro ao buscar ultima atualizacao:', err);
    return 'Desconhecido';
  }
}

/**
 * Retorna técnicos com itens pendentes há mais de `limiarDias` dias.
 * Usado no modal de alertas ao abrir o dashboard.
 */
export async function buscarAlertasAging(filtros = {}, limiarDias = 30) {
  const projeto = filtros.projeto === 'ETER' ? 'ETER' : 'EMIS';
  const config = CONFIG_PROJETOS[projeto];

  try {
    const resultado = await sql.query(`
      SELECT
        ${config.colunas.tecnico} AS nome,
        ${config.colunas.base}    AS base,
        COUNT(*)                                                       AS total,
        MAX(DATE_PART('day', NOW() - ${config.colunas.data}))::int    AS max_dias,
        ROUND(AVG(DATE_PART('day', NOW() - ${config.colunas.data})))::int AS media_dias
      FROM ${config.tabela}
      WHERE ${config.condicao_pendente}
        AND ${config.colunas.data} IS NOT NULL
        AND DATE_PART('day', NOW() - ${config.colunas.data}) > $1
      GROUP BY ${config.colunas.tecnico}, ${config.colunas.base}
      ORDER BY max_dias DESC
      LIMIT 15
    `, [limiarDias]);

    return resultado.rows || resultado;
  } catch (err) {
    console.error('Erro ao buscar alertas de aging:', err);
    return [];
  }
}

/**
 * Retorna aging médio por data para o gráfico de linhas.
 * Eixo X = data de criação/alteração; Eixo Y = dias de aging.
 */
export async function buscarAgingPorData(filtros = {}) {
  const projeto = filtros.projeto === 'ETER' ? 'ETER' : 'EMIS';

  try {
    let query;
    if (projeto === 'EMIS') {
      query = `
        SELECT
          dt_solicitacao::date AS data_ref,
          ROUND(AVG(DATE_PART('day', NOW() - dt_solicitacao::timestamp)))::int AS media_dias,
          COUNT(*) AS quantidade
        FROM movimentacao_tecnico
        WHERE dt_solicitacao IS NOT NULL AND dt_solicitacao <> ''
          AND dt_solicitacao::date >= NOW() - INTERVAL '180 days'
          AND (aceite_destinatario = 'Sem resposta' OR aceite_destinatario IS NULL
               OR aceite_destinatario = '' OR aceite_destinatario = 'Pendente')
        GROUP BY dt_solicitacao::date
        ORDER BY data_ref
      `;
    } else {
      query = `
        SELECT
          to_date(NULLIF(data_alteracao, ''), 'DD/MM/YYYY') AS data_ref,
          ROUND(AVG(DATE_PART('day', NOW() - to_timestamp(NULLIF(data_alteracao, ''), 'DD/MM/YYYY'))))::int AS media_dias,
          COUNT(*) AS quantidade
        FROM relatorio_equipamento
        WHERE data_alteracao IS NOT NULL AND data_alteracao <> ''
          AND to_date(NULLIF(data_alteracao, ''), 'DD/MM/YYYY') >= NOW() - INTERVAL '180 days'
        GROUP BY data_ref
        ORDER BY data_ref
      `;
    }

    const resultado = await sql.query(query);
    return (resultado.rows || resultado).map(r => ({
      data: r.data_ref ? new Date(r.data_ref).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '?',
      media_dias: r.media_dias || 0,
      quantidade: parseInt(r.quantidade || 0),
    }));
  } catch (err) {
    console.error('Erro ao buscar aging por data:', err);
    return [];
  }
}

/**
 * Retorna resumo unificado de pendências para EMIS e ETER por técnico.
 * Garante a criação de uma VIEW no banco e busca a partir dela.
 */
export async function buscarResumoUnificado() {
  try {
    // Dropa a view existente se houver conflito de colunas
    await sql.query(`DROP VIEW IF EXISTS view_resumo_pendencias CASCADE;`);

    // 1. Cria ou substitui a VIEW para garantir integridade e performance
    await sql.query(`
      CREATE OR REPLACE VIEW view_resumo_pendencias AS
      WITH emis_pendentes AS (
        SELECT
          recebido_por AS nome,
          COUNT(*)::int AS qtd,
          string_agg(DISTINCT miscelanea, ', ') AS materiais,
          string_agg(DISTINCT base, ', ') AS bases,
          COALESCE(MAX(DATE_PART('day', NOW() - COALESCE(NULLIF(dt_resposta, ''), dt_solicitacao)::timestamp)), 0)::int AS dias
        FROM movimentacao_tecnico
        WHERE (aceite_destinatario = 'Sem resposta' OR aceite_destinatario IS NULL OR aceite_destinatario = '' OR aceite_destinatario = 'Pendente')
          AND dt_solicitacao IS NOT NULL AND dt_solicitacao <> ''
        GROUP BY recebido_por
      ),
      eter_pendentes AS (
        SELECT
          tecnico AS nome,
          COUNT(*)::int AS qtd,
          string_agg(DISTINCT descricao, ', ') AS materiais,
          string_agg(DISTINCT cidade, ', ') AS bases,
          COALESCE(MAX(DATE_PART('day', NOW() - to_timestamp(NULLIF(data_alteracao, ''), 'DD/MM/YYYY'))), 0)::int AS dias
        FROM relatorio_equipamento
        WHERE data_alteracao IS NOT NULL AND data_alteracao <> ''
        GROUP BY tecnico
      )
      SELECT
        COALESCE(e.nome, et.nome) AS nome,
        COALESCE(e.qtd, 0)::int AS emis_qtd,
        COALESCE(et.qtd, 0)::int AS eter_qtd,
        (COALESCE(e.qtd, 0) + COALESCE(et.qtd, 0))::int AS total_qtd,
        GREATEST(COALESCE(e.dias, 0), COALESCE(et.dias, 0))::int AS dias_max,
        COALESCE(e.dias, 0)::int AS emis_dias,
        COALESCE(et.dias, 0)::int AS eter_dias,
        COALESCE(e.materiais, '') AS emis_materiais,
        COALESCE(et.materiais, '') AS eter_materiais,
        TRIM(BOTH ', ' FROM COALESCE(e.bases, '') || ', ' || COALESCE(et.bases, '')) AS bases
      FROM emis_pendentes e
      FULL OUTER JOIN eter_pendentes et ON LOWER(TRIM(e.nome)) = LOWER(TRIM(et.nome))
      ORDER BY total_qtd DESC;
    `);

    // 2. Consulta os dados da VIEW
    const resultado = await sql.query(`SELECT * FROM view_resumo_pendencias`);
    return (resultado.rows || resultado).map(r => ({
      nome: r.nome || 'N/A',
      emis_qtd: parseInt(r.emis_qtd || 0),
      eter_qtd: parseInt(r.eter_qtd || 0),
      total_qtd: parseInt(r.total_qtd || 0),
      dias_max: parseInt(r.dias_max || 0),
      emis_dias: parseInt(r.emis_dias || 0),
      eter_dias: parseInt(r.eter_dias || 0),
      emis_materiais: r.emis_materiais || '',
      eter_materiais: r.eter_materiais || '',
      bases: r.bases || ''
    }));
  } catch (err) {
    console.error('Erro ao buscar resumo unificado:', err);
    return [];
  }
}

