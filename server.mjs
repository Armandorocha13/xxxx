import http from 'http';
import fs from 'fs';
import path from 'path';
import { getDashboardData } from './dashboard.mjs';
import { executarBuscarDadosDashboard } from './casos_de_uso/buscar_dados_dashboard.mjs';
import { URL } from 'url';

const PORT = 3000;

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);

  function mapearRespostaNova(dados) {
    return {
      kpis: {
        aceitos: dados.kpis.accepted,
        pendentes: dados.kpis.pending
      },
      top_pendentes: dados.topPending.map(item => ({
        nome: item.name,
        total: item.count
      })),
      distribuicao_base: dados.baseDistribution.map(item => ({
        base: item.base,
        total: item.count
      })),
      tabela_resumo: dados.summaryTable.map(item => ({
        nome: item.name,
        material: item.material,
        total: item.count
      })),
      listas_filtros: {
        tecnicos: dados.filters.technicians,
        bases: dados.filters.bases,
        materiais: dados.filters.materials
      }
    };
  }
  
  // API Endpoint
  if (parsedUrl.pathname === '/api/data') {
    const filters = {
      name: parsedUrl.searchParams.get('name') || parsedUrl.searchParams.get('nome'),
      material: parsedUrl.searchParams.get('material'),
      base: parsedUrl.searchParams.get('base')
    };
    try {
      const data = await getDashboardData(filters);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    } catch (error) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: error.message }));
    }
    return;
  }

  if (parsedUrl.pathname === '/api/dados_dashboard') {
    const filtros = {
      nome: parsedUrl.searchParams.get('nome') || parsedUrl.searchParams.get('name'),
      material: parsedUrl.searchParams.get('material'),
      base: parsedUrl.searchParams.get('base')
    };
    try {
      const data = await executarBuscarDadosDashboard(filtros);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(mapearRespostaNova(data)));
    } catch (error) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: error.message }));
    }
    return;
  }

  // Static files
  let filePath = '.' + parsedUrl.pathname;
  if (filePath === './') filePath = './index.html';
  const fileBase = path.basename(filePath);
  const candidates = [
    filePath,
    path.join('.', fileBase),
    path.join('.', 'apresentacao', 'paginas_web', fileBase),
  ];
  const existingPath = candidates.find(candidate => fs.existsSync(candidate));

  const extname = path.extname(existingPath || filePath);
  let contentType = 'text/html';
  switch (extname) {
    case '.js': contentType = 'text/javascript'; break;
    case '.css': contentType = 'text/css'; break;
    case '.png': contentType = 'image/png'; break;
  }

  fs.readFile(existingPath || filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404);
        res.end('File not found');
      } else {
        res.writeHead(500);
        res.end('Server error: ' + error.code);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
