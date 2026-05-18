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
