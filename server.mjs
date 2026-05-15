import http from 'http';
import fs from 'fs';
import path from 'path';
import { getDashboardData } from './dashboard.mjs';
import { URL } from 'url';

const PORT = 3000;

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
  
  // API Endpoint
  if (parsedUrl.pathname === '/api/data') {
    const filters = {
      name: parsedUrl.searchParams.get('name'),
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

  // Static files
  let filePath = '.' + parsedUrl.pathname;
  if (filePath === './') filePath = './index.html';

  const extname = path.extname(filePath);
  let contentType = 'text/html';
  switch (extname) {
    case '.js': contentType = 'text/javascript'; break;
    case '.css': contentType = 'text/css'; break;
    case '.png': contentType = 'image/png'; break;
  }

  fs.readFile(filePath, (error, content) => {
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
