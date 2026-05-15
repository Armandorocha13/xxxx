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
import { configuracoes }             from './configuracoes/configuracao_global.mjs';

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
 * Ordem de busca: 1) apresentacao/paginas_web/  2) raiz do projeto
 */
function servirArquivo(pathname, res) {
  const nome = pathname === '/' ? 'index.html' : pathname;

  const candidatos = [
    path.join(__dirname, 'apresentacao', 'paginas_web', nome),
    path.join(__dirname, nome),
  ];

  const caminho = candidatos.find(p => fs.existsSync(p));

  if (!caminho) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 — Arquivo não encontrado');
    return;
  }

  const ext     = path.extname(caminho);
  const mime    = TIPOS_MIME[ext] || 'application/octet-stream';

  fs.readFile(caminho, (err, data) => {
    if (err) {
      res.writeHead(500);
      res.end('Erro interno');
    } else {
      res.writeHead(200, { 'Content-Type': mime });
      res.end(data);
    }
  });
}

/** Roteador de requisições */
const servidor = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === '/api/dados_dashboard') {
    await controladorDadosDashboard(req, res, url);
    return;
  }

  servirArquivo(url.pathname, res);
});

servidor.listen(configuracoes.porta, () => {
  console.log(`✅ Servidor rodando em http://localhost:${configuracoes.porta}`);
});
