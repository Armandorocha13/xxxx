/**
 * Controlador da API do Dashboard
 * =================================
 * Faz a ponte entre as requisições HTTP e os casos de uso.
 * Responsável por extrair parâmetros, invocar o caso de uso
 * e formatar a resposta HTTP. Não contém lógica de negócio.
 */

import { executarBuscarDadosDashboard } from '../casos_de_uso/buscar_dados_dashboard.mjs';

/**
 * Processa a requisição GET /api/dados_dashboard e retorna JSON.
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 * @param {URL} url - URL já processada com searchParams
 */
export async function controladorDadosDashboard(req, res, url) {
  // Extrai os filtros dos query params da URL
  const filtros = {
    projeto: url.searchParams.get('projeto') || 'EMIS',
    nome: url.searchParams.get('nome') || url.searchParams.get('name') || null,
    material: url.searchParams.get('material') || null,
    base: url.searchParams.get('base') || null,
    status: url.searchParams.get('status') || null,
  };

  try {
    const dados = await executarBuscarDadosDashboard(filtros);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(dados));
  } catch (erro) {
    console.error('[ERRO] Falha ao buscar dados do dashboard:', erro.message);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ erro: 'Erro interno do servidor' }));
  }
}
