/**
 * Servidor API para o Dashboard de Aceites
 * Responsável por servir arquivos estáticos e prover os endpoints de dados.
 */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, URL } from 'url';
import { buscarDadosDashboard } from '../logica_negocio/buscar_dados.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORTA = process.env.PORT || 3000;

/**
 * Mapeamento de extensões de arquivos para tipos MIME.
 */
const TIPOS_MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.webp': 'image/webp'
};

const servidor = http.createServer(async (req, res) => {
  const urlProcessada = new URL(req.url, `http://${req.headers.host}`);
  
  // Rota da API de Dados
  if (urlProcessada.pathname === '/api/dados_dashboard') {
    const filtros = {
      nome: urlProcessada.searchParams.get('nome'),
      material: urlProcessada.searchParams.get('material'),
      base: urlProcessada.searchParams.get('base')
    };

    try {
      const dados = await buscarDadosDashboard(filtros);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(dados));
    } catch (erro) {
      console.error('Erro ao buscar dados:', erro);
      res.writeHead(500);
      res.end('Erro interno do servidor');
    }
    return;
  }

  // Servir arquivos estáticos da pasta frontend_dashboard e recursos_estaticos
  let caminhoArquivo = path.join(__dirname, '../frontend_dashboard', urlProcessada.pathname === '/' ? 'index.html' : urlProcessada.pathname);
  
  // Tentar na pasta de recursos estáticos se não encontrar no frontend
  if (!fs.existsSync(caminhoArquivo)) {
    caminhoArquivo = path.join(__dirname, '..', urlProcessada.pathname);
  }

  const extensao = path.extname(caminhoArquivo);
  const tipoMime = TIPOS_MIME[extensao] || 'application/octet-stream';

  fs.readFile(caminhoArquivo, (erro, conteudo) => {
    if (erro) {
      if (erro.code === 'ENOENT') {
        res.writeHead(404);
        res.end('Arquivo não encontrado');
      } else {
        res.writeHead(500);
        res.end(`Erro no servidor: ${erro.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': tipoMime });
      res.end(conteudo, 'utf-8');
    }
  });
});

servidor.listen(PORTA, () => {
  console.log(`Servidor rodando em http://localhost:${PORTA}`);
});
