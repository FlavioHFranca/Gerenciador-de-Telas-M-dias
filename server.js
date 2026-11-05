const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'screens.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// Garante que as pastas necessárias existam
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
}

// Persistência em JSON
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Erro ao ler screens.json:', err);
  }

  // Dados iniciais com uma tela de exemplo
  const initialData = {
    screens: [
      {
        id: 'screen_default',
        code: 'SIGN-1080',
        name: 'Painel Principal',
        orientation: 'horizontal', // 'horizontal' (1920x1080) ou 'vertical' (1080x1920)
        fitMode: 'contain', // 'contain' ou 'cover'
        defaultImageDuration: 10, // segundos
        createdAt: new Date().toISOString(),
        playlist: []
      }
    ]
  };
  saveData(initialData);
  return initialData;
}

function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Erro ao salvar screens.json:', err);
  }
}

let db = loadData();

// Gerador de código alfanumérico amigável (ex: SIGN-8429)
function generateScreenCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 4; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `ZP-${rand}`;
}

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos de mídia da pasta uploads
app.use('/uploads', express.static(UPLOADS_DIR, {
  setHeaders: (res, filePath) => {
    res.setHeader('Accept-Ranges', 'bytes');
  }
}));

// Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, 'public')));

// Configuração do Multer para upload de imagens e vídeos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

const allowedMimes = [
  // Imagens
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  // Vídeos
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime'
];

const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024 // Limite de 500MB por arquivo
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.mp4', '.webm', '.ogg', '.mov'];
    
    if (allowedMimes.includes(file.mimetype) || validExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de arquivo não permitido (${file.mimetype}). Use imagens (JPG, PNG, GIF, WEBP) ou vídeos (MP4, WEBM, MOV, OGG).`));
    }
  }
});

// ================= ROTAS DE PÁGINAS =================
// Rota 1: Painel Administrativo
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Rota 2: Player de Exibição
app.get('/player', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'player.html'));
});

app.get('/player/:code', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'player.html'));
});

// ================= ROTAS DA API =================

// Listar todas as telas
app.get('/api/screens', (req, res) => {
  res.json(db.screens);
});

// Obter uma tela pelo código
app.get('/api/screens/:code', (req, res) => {
  const code = req.params.code.toUpperCase();
  const screen = db.screens.find(s => s.code.toUpperCase() === code);
  if (!screen) {
    return res.status(404).json({ error: 'Tela não encontrada com o código informado.' });
  }
  res.json(screen);
});

// Criar nova tela
app.post('/api/screens', (req, res) => {
  const { name, orientation, fitMode, defaultImageDuration } = req.body;
  let code = (req.body.code || generateScreenCode()).toUpperCase().trim();

  // Verifica se o código já existe
  if (db.screens.some(s => s.code.toUpperCase() === code)) {
    code = generateScreenCode();
  }

  const newScreen = {
    id: 'screen_' + Date.now(),
    code,
    name: name || `Tela ${code}`,
    orientation: orientation === 'vertical' ? 'vertical' : 'horizontal',
    fitMode: fitMode === 'cover' ? 'cover' : 'contain',
    defaultImageDuration: Number(defaultImageDuration) || 10,
    createdAt: new Date().toISOString(),
    playlist: []
  };

  db.screens.push(newScreen);
  saveData(db);
  res.status(201).json(newScreen);
});

// Atualizar configurações da tela (nome, orientação, etc.)
app.put('/api/screens/:code', (req, res) => {
  const code = req.params.code.toUpperCase();
  const screen = db.screens.find(s => s.code.toUpperCase() === code);
  if (!screen) {
    return res.status(404).json({ error: 'Tela não encontrada.' });
  }

  const { name, orientation, fitMode, defaultImageDuration } = req.body;
  if (name !== undefined) screen.name = name;
  if (orientation !== undefined) {
    screen.orientation = orientation === 'vertical' ? 'vertical' : 'horizontal';
  }
  if (fitMode !== undefined) {
    screen.fitMode = fitMode === 'cover' ? 'cover' : 'contain';
  }
  if (defaultImageDuration !== undefined) {
    screen.defaultImageDuration = Math.max(2, Number(defaultImageDuration) || 10);
  }

  saveData(db);

  // Notifica o player em tempo real via Socket.io
  io.to(screen.code).emit('screen-updated', screen);

  res.json(screen);
});

// Deletar tela
app.delete('/api/screens/:code', (req, res) => {
  const code = req.params.code.toUpperCase();
  const screenIndex = db.screens.findIndex(s => s.code.toUpperCase() === code);
  if (screenIndex === -1) {
    return res.status(404).json({ error: 'Tela não encontrada.' });
  }

  const [removed] = db.screens.splice(screenIndex, 1);
  // Remove arquivos de mídia da tela
  if (removed.playlist && removed.playlist.length > 0) {
    removed.playlist.forEach(item => {
      const filePath = path.join(UPLOADS_DIR, item.filename);
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (e) {}
      }
    });
  }

  saveData(db);
  io.to(code).emit('screen-deleted', { code });
  res.json({ message: 'Tela excluída com sucesso.' });
});

// Upload de mídias para a tela
app.post('/api/screens/:code/upload', upload.array('files', 20), (req, res) => {
  const code = req.params.code.toUpperCase();
  const screen = db.screens.find(s => s.code.toUpperCase() === code);
  if (!screen) {
    return res.status(404).json({ error: 'Tela não encontrada.' });
  }

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
  }

  const customDuration = Number(req.body.duration) || screen.defaultImageDuration || 10;
  const newItems = [];

  req.files.forEach((file) => {
    const isVideo = file.mimetype.startsWith('video/') || 
      ['.mp4', '.webm', '.ogg', '.mov'].includes(path.extname(file.originalname).toLowerCase());

    const mediaItem = {
      id: 'media_' + Date.now() + '_' + Math.round(Math.random() * 10000),
      filename: file.filename,
      originalName: file.originalname,
      type: isVideo ? 'video' : 'image',
      mimeType: file.mimetype,
      size: file.size,
      duration: isVideo ? 0 : customDuration, // Para vídeo, 0 significa duração natural do vídeo
      order: screen.playlist.length + newItems.length,
      active: true,
      createdAt: new Date().toISOString()
    };

    newItems.push(mediaItem);
    screen.playlist.push(mediaItem);
  });

  saveData(db);

  // Notifica o player em tempo real
  io.to(screen.code).emit('screen-updated', screen);

  res.status(201).json({
    message: `${newItems.length} arquivo(s) adicionado(s) com sucesso.`,
    playlist: screen.playlist,
    screen
  });
});

// Atualizar um item da playlist (duração, ativo/inativo, ordem)
app.patch('/api/screens/:code/media/:mediaId', (req, res) => {
  const code = req.params.code.toUpperCase();
  const screen = db.screens.find(s => s.code.toUpperCase() === code);
  if (!screen) {
    return res.status(404).json({ error: 'Tela não encontrada.' });
  }

  const item = screen.playlist.find(m => m.id === req.params.mediaId);
  if (!item) {
    return res.status(404).json({ error: 'Mídia não encontrada na playlist.' });
  }

  if (req.body.duration !== undefined) {
    item.duration = Math.max(1, Number(req.body.duration) || 10);
  }
  if (req.body.active !== undefined) {
    item.active = Boolean(req.body.active);
  }

  saveData(db);
  io.to(screen.code).emit('screen-updated', screen);

  res.json(item);
});

// Reordenar playlist
app.put('/api/screens/:code/reorder', (req, res) => {
  const code = req.params.code.toUpperCase();
  const screen = db.screens.find(s => s.code.toUpperCase() === code);
  if (!screen) {
    return res.status(404).json({ error: 'Tela não encontrada.' });
  }

  const { orderedIds } = req.body;
  if (Array.isArray(orderedIds)) {
    const reordered = [];
    orderedIds.forEach(id => {
      const found = screen.playlist.find(m => m.id === id);
      if (found) reordered.push(found);
    });
    // Se algum ficou de fora, anexa no fim
    screen.playlist.forEach(m => {
      if (!reordered.find(r => r.id === m.id)) {
        reordered.push(m);
      }
    });
    screen.playlist = reordered.map((item, idx) => ({ ...item, order: idx }));
    saveData(db);
    io.to(screen.code).emit('screen-updated', screen);
  }

  res.json(screen.playlist);
});

// Remover mídia da tela
app.delete('/api/screens/:code/media/:mediaId', (req, res) => {
  const code = req.params.code.toUpperCase();
  const screen = db.screens.find(s => s.code.toUpperCase() === code);
  if (!screen) {
    return res.status(404).json({ error: 'Tela não encontrada.' });
  }

  const mediaIndex = screen.playlist.findIndex(m => m.id === req.params.mediaId);
  if (mediaIndex === -1) {
    return res.status(404).json({ error: 'Mídia não encontrada na playlist.' });
  }

  const [removed] = screen.playlist.splice(mediaIndex, 1);
  const filePath = path.join(UPLOADS_DIR, removed.filename);
  if (fs.existsSync(filePath)) {
    try { fs.unlinkSync(filePath); } catch (e) {}
  }

  saveData(db);
  io.to(screen.code).emit('screen-updated', screen);

  res.json({ message: 'Mídia removida com sucesso.', playlist: screen.playlist });
});

// ================= SOCKET.IO (CONEXÃO EM TEMPO REAL) =================
// Rastreamento de telas conectadas
const activePlayers = new Map(); // socketId -> screenCode

io.on('connection', (socket) => {
  // Player se conecta a uma tela pelo código
  socket.on('join-screen', (screenCode) => {
    if (!screenCode) return;
    const code = screenCode.toUpperCase().trim();
    socket.join(code);
    activePlayers.set(socket.id, code);

    // Notifica os painéis admin que a tela está online
    io.emit('player-status-changed', {
      code,
      status: 'online',
      activeCount: io.sockets.adapter.rooms.get(code)?.size || 1
    });

    // Envia o estado atual da tela para o player recém-conectado
    const screen = db.screens.find(s => s.code.toUpperCase() === code);
    if (screen) {
      socket.emit('screen-init', screen);
    } else {
      socket.emit('screen-not-found', { code });
    }
  });

  // Admin solicita status dos players
  socket.on('get-active-players', () => {
    const statusMap = {};
    db.screens.forEach(s => {
      const room = io.sockets.adapter.rooms.get(s.code.toUpperCase());
      statusMap[s.code] = room && room.size > 0 ? room.size : 0;
    });
    socket.emit('active-players-status', statusMap);
  });

  socket.on('disconnect', () => {
    const code = activePlayers.get(socket.id);
    if (code) {
      activePlayers.delete(socket.id);
      const remaining = io.sockets.adapter.rooms.get(code)?.size || 0;
      io.emit('player-status-changed', {
        code,
        status: remaining > 0 ? 'online' : 'offline',
        activeCount: remaining
      });
    }
  });
});

// Tratamento global de erros
app.use((err, req, res, next) => {
  console.error('Erro na requisição:', err.message);
  res.status(500).json({ error: err.message || 'Erro interno no servidor.' });
});

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Gerenciador de Telas rodando em http://localhost:${PORT}`);
  console.log(`📺 Rota 1 (Painel Admin): http://localhost:${PORT}/`);
  console.log(`🎬 Rota 2 (Player Fullscreen): http://localhost:${PORT}/player`);
  console.log(`====================================================`);
});
