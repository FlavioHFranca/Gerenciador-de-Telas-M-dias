const fs = require('fs');
const path = require('path');

const UPLOADS_DIR = path.join(__dirname, 'uploads');
const DATA_FILE = path.join(__dirname, 'data', 'screens.json');

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// 1. Mídia de Exemplo Horizontal (1920x1080)
const horizontalSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <defs>
    <linearGradient id="gradH" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="50%" stop-color="#1e1b4b" />
      <stop offset="100%" stop-color="#31104b" />
    </linearGradient>
    <linearGradient id="accentH" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#6366f1" />
      <stop offset="100%" stop-color="#a855f7" />
    </linearGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#gradH)" />
  <circle cx="960" cy="540" r="420" fill="#6366f1" opacity="0.12" />
  <circle cx="1600" cy="200" r="260" fill="#a855f7" opacity="0.15" />
  
  <rect x="260" y="220" width="1400" height="640" rx="40" fill="rgba(15, 23, 42, 0.75)" stroke="#6366f1" stroke-width="3" />
  
  <text x="960" y="380" font-family="system-ui, -apple-system, sans-serif" font-size="64" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="2">
    ZAPPSIGNAGE • DIGITAL SIGNAGE
  </text>
  <text x="960" y="470" font-family="system-ui, -apple-system, sans-serif" font-size="44" font-weight="700" fill="url(#accentH)" text-anchor="middle">
    FORMATO HORIZONTAL — 1920 × 1080 (16:9)
  </text>
  <text x="960" y="550" font-family="system-ui, -apple-system, sans-serif" font-size="30" fill="#94a3b8" text-anchor="middle">
    Ideal para TVs, Monitores Comerciais, Vitrines e Telões
  </text>
  
  <rect x="760" y="620" width="400" height="80" rx="20" fill="url(#accentH)" />
  <text x="960" y="675" font-family="system-ui, -apple-system, sans-serif" font-size="32" font-weight="bold" fill="#ffffff" text-anchor="middle">
    REPRODUÇÃO FULLSCREEN
  </text>
  
  <text x="960" y="780" font-family="monospace" font-size="24" fill="#64748b" text-anchor="middle">
    Conectado via Socket.io • Atualização Instantânea em Tempo Real
  </text>
</svg>`;

// 2. Mídia de Exemplo Vertical (1080x1920)
const verticalSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
  <defs>
    <linearGradient id="gradV" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#090d16" />
      <stop offset="50%" stop-color="#0f2b38" />
      <stop offset="100%" stop-color="#022c22" />
    </linearGradient>
    <linearGradient id="accentV" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10b981" />
      <stop offset="100%" stop-color="#06b6d4" />
    </linearGradient>
  </defs>
  <rect width="1080" height="1920" fill="url(#gradV)" />
  <circle cx="540" cy="960" r="450" fill="#10b981" opacity="0.1" />
  <circle cx="200" cy="300" r="300" fill="#06b6d4" opacity="0.12" />

  <rect x="120" y="240" width="840" height="1440" rx="48" fill="rgba(15, 23, 42, 0.8)" stroke="#10b981" stroke-width="4" />

  <text x="540" y="460" font-family="system-ui, -apple-system, sans-serif" font-size="52" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="2">
    ZAPPSIGNAGE
  </text>
  <text x="540" y="540" font-family="system-ui, -apple-system, sans-serif" font-size="34" font-weight="800" fill="url(#accentV)" text-anchor="middle">
    FORMATO VERTICAL
  </text>
  <text x="540" y="610" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="bold" fill="#6ee7b7" text-anchor="middle">
    1080 × 1920 (9:16)
  </text>

  <rect x="240" y="720" width="600" height="2" fill="#334155" />

  <text x="540" y="820" font-family="system-ui, -apple-system, sans-serif" font-size="30" fill="#cbd5e1" text-anchor="middle">
    Perfeito para Totens Verticais
  </text>
  <text x="540" y="870" font-family="system-ui, -apple-system, sans-serif" font-size="28" fill="#94a3b8" text-anchor="middle">
    Displays de Shopping &amp; Recepção
  </text>

  <rect x="290" y="980" width="500" height="110" rx="30" fill="url(#accentV)" />
  <text x="540" y="1050" font-family="system-ui, -apple-system, sans-serif" font-size="38" font-weight="bold" fill="#022c22" text-anchor="middle">
    MODO RETRATO
  </text>

  <text x="540" y="1220" font-family="monospace" font-size="24" fill="#64748b" text-anchor="middle">
    Vídeos e Imagens em Full Screen
  </text>
  <text x="540" y="1270" font-family="monospace" font-size="22" fill="#475569" text-anchor="middle">
    Sincronização por Código Único
  </text>
</svg>`;

const hFileName = 'demo-horizontal.svg';
const vFileName = 'demo-vertical.svg';

fs.writeFileSync(path.join(UPLOADS_DIR, hFileName), horizontalSvg, 'utf-8');
fs.writeFileSync(path.join(UPLOADS_DIR, vFileName), verticalSvg, 'utf-8');

console.log('Arquivos de demonstração criados em /uploads');

// Atualiza o db com mídias de demonstração para a tela padrão
const dbData = {
  screens: [
    {
      id: 'screen_default',
      code: 'SIGN-1080',
      name: 'Painel Principal (Exemplo)',
      orientation: 'horizontal',
      fitMode: 'contain',
      defaultImageDuration: 8,
      createdAt: new Date().toISOString(),
      playlist: [
        {
          id: 'media_sample_1',
          filename: hFileName,
          originalName: 'demo-horizontal-1920x1080.svg',
          type: 'image',
          mimeType: 'image/svg+xml',
          size: Buffer.byteLength(horizontalSvg),
          duration: 8,
          order: 0,
          active: true,
          createdAt: new Date().toISOString()
        },
        {
          id: 'media_sample_2',
          filename: vFileName,
          originalName: 'demo-vertical-1080x1920.svg',
          type: 'image',
          mimeType: 'image/svg+xml',
          size: Buffer.byteLength(verticalSvg),
          duration: 8,
          order: 1,
          active: true,
          createdAt: new Date().toISOString()
        }
      ]
    }
  ]
};

fs.writeFileSync(DATA_FILE, JSON.stringify(dbData, null, 2), 'utf-8');
console.log('screens.json atualizado com mídias de demonstração prontas.');
