/**
 * Servidor HTTP Principal — Arquitetura Limpa
 * =============================================
 * Ponto de entrada da aplicação.
 * Para iniciar: node servidor.mjs
 */

import http       from 'http';
import fs         from 'fs';
import path       from 'path';
import { fileURLToPath, URL } from 'url';
import { controladorDadosDashboard } from './controladores/controlador_dashboard.mjs';
import { executarBuscarDadosDashboard } from './casos_de_uso/buscar_dados_dashboard.mjs';
import { configuracoes }             from './configuracoes/configuracao_global.mjs';
import { buscarResumoUnificado }     from './repositorios/repositorio_aceites.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

/** Mapeamento de extensões → Content-Type */
const TIPOS_MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js'  : 'text/javascript',
  '.css' : 'text/css',
  '.json': 'application/json',
  '.png' : 'image/png',
  '.jpg' : 'image/jpeg',
  '.webp': 'image/webp',
  '.svg' : 'image/svg+xml',
};

/**
 * Serve arquivos estáticos.
 */
function servirArquivo(pathname, res) {
  // Se for a raiz, serve o index.html da pasta web
  let relativePath = pathname === '/' ? '/apresentacao/paginas_web/index.html' : pathname;
  
  const candidatos = [
    path.join(__dirname, relativePath),
    path.join(__dirname, 'apresentacao', 'paginas_web', relativePath),
    path.join(__dirname, path.basename(relativePath))
  ];

  const caminho = candidatos.find(p => fs.existsSync(p) && fs.statSync(p).isFile());

  if (!caminho) {
    console.warn(`[AVISO] Arquivo não encontrado: ${pathname}`);
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 — Arquivo não encontrado');
    return;
  }

  const ext     = path.extname(caminho).toLowerCase();
  const mime    = TIPOS_MIME[ext] || 'application/octet-stream';

  fs.readFile(caminho, (err, data) => {
    if (err) {
      console.error(`[ERRO] Falha ao ler arquivo ${caminho}:`, err.message);
      res.writeHead(500);
      res.end('Erro interno');
    } else {
      res.writeHead(200, { 'Content-Type': mime });
      res.end(data);
    }
  });
}

function mapearRespostaLegada(dados) {
  return {
    kpis: {
      accepted: dados.kpis.aceitos,
      pending: dados.kpis.pendentes,
    },
    topPending: dados.top_pendentes.map(item => ({
      name: item.nome,
      count: item.total,
    })),
    baseDistribution: dados.distribuicao_base.map(item => ({
      base: item.base,
      count: item.total,
    })),
    summaryTable: dados.tabela_resumo.map(item => ({
      name: item.nome,
      material: item.material,
      count: item.total,
    })),
    filters: {
      technicians: dados.listas_filtros.tecnicos,
      bases: dados.listas_filtros.bases,
      materials: dados.listas_filtros.materiais,
    },
  };
}

/** Roteador de requisições compatível com Vercel e Local */
export default async function handler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === '/api/dados_dashboard') {
    await controladorDadosDashboard(req, res, url);
    return;
  }

  if (url.pathname === '/api/upload' && req.method === 'POST') {
    await controladorUpload(req, res);
    return;
  }


  if (url.pathname === '/api/data') {
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
      res.end(JSON.stringify(mapearRespostaLegada(dados)));
    } catch (erro) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ erro: 'Erro interno do servidor' }));
    }
    return;
  }

  if (url.pathname === '/api/resumo_unificado') {
    try {
      const dados = await buscarResumoUnificado();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(dados));
    } catch (erro) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ erro: 'Erro ao buscar resumo unificado' }));
    }
    return;
  }

  servirArquivo(url.pathname, res);
}

// Só escuta na porta local se não estiver rodando como Vercel Serverless Function
if (!process.env.VERCEL) {
  const servidor = http.createServer(handler);
  servidor.listen(configuracoes.porta, () => {
    console.log(`✅ Servidor rodando em http://localhost:${configuracoes.porta}`);
  });
}
