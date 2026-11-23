/**
 * ReciclaBelém - Servidor Local Zero-Dependency (Node.js)
 * Serve o aplicativo Web/PWA, disponibiliza a API REST (/api/db e /api/news/refresh)
 * e executa o coletor automático de notícias todos os dias (manhã 08h e noite 20h).
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { fetchAndUpdateNews } = require('./scripts/fetch-news');

const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'data', 'database.json');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

let lastSyncSlotKey = '';

function getCurrentScheduleSlotKey() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hour = now.getHours();
  if (hour >= 20) return `${yyyy}-${mm}-${dd}-noite`;
  if (hour >= 8) return `${yyyy}-${mm}-${dd}-manha`;
  return null;
}

async function runScheduledNewsCheck() {
  try {
    const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    const lastSync = db?.meta?.lastNewsSync ? new Date(db.meta.lastNewsSync).getTime() : 0;
    const hoursSinceLast = (Date.now() - lastSync) / 3600000;
    const slotKey = getCurrentScheduleSlotKey();

    if (hoursSinceLast >= 12 || (slotKey && slotKey !== lastSyncSlotKey && hoursSinceLast >= 6)) {
      console.log('📰 Atualizando notícias de ecologia (Belém, Ananindeua e Outeiro)...');
      const result = await fetchAndUpdateNews();
      if (result.ok) {
        if (slotKey) lastSyncSlotKey = slotKey;
        console.log(`✅ Notícias atualizadas: ${result.added} matérias (${result.withImages} com foto).`);
      }
    }
  } catch (err) {
    console.warn('⚠️ Erro na verificação agendada de notícias:', err.message);
  }
}

const server = http.createServer(async (req, res) => {
  const urlObj = new URL(req.url, `http://${req.headers.host}`);
  const pathname = urlObj.pathname;

  // Endpoint REST: GET /api/db
  if (pathname === '/api/db' && req.method === 'GET') {
    fs.readFile(DB_PATH, 'utf8', (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Erro ao ler data/database.json' }));
      }
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(data);
    });
    return;
  }

  // Endpoint REST: POST /api/db
  if (pathname === '/api/db' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body);
        fs.writeFile(DB_PATH, JSON.stringify(parsed, null, 2), 'utf8', (err) => {
          if (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'Erro ao gravar data/database.json' }));
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true }));
        });
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'JSON inválido' }));
      }
    });
    return;
  }

  // Endpoint REST: POST /api/news/refresh (atualiza notícias sob demanda)
  if (pathname === '/api/news/refresh' && req.method === 'POST') {
    try {
      const result = await fetchAndUpdateNews();
      const updatedDb = fs.readFileSync(DB_PATH, 'utf8');
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ...result, db: JSON.parse(updatedDb) }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: err.message }));
    }
    return;
  }

  // Servir arquivos estáticos
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);

  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    return res.end('Acesso negado');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Arquivo não encontrado');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log('==========================================================');
  console.log(`🌱 ReciclaBelém rodando em: http://localhost:${PORT}`);
  console.log(`💾 Banco de dados sincronizado em: ${DB_PATH}`);
  console.log('📰 Agendador de notícias ativo (atualização diária 08h e 20h)');
  console.log('==========================================================');

  // Verifica na inicialização e depois a cada 15 minutos
  runScheduledNewsCheck();
  setInterval(runScheduledNewsCheck, 15 * 60 * 1000);
});
