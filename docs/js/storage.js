/**
 * Display Manager - Storage & Real-Time Engine (Dual Mode: Server + Client-Side IndexedDB)
 * Permite funcionamento tanto em servidores Node.js/Docker quanto 100% estático no GitHub Pages.
 */

const isGitHubPages = window.location.hostname.includes('github.io') || window.location.protocol === 'file:';

// Inicialização do IndexedDB para suporte a mídias locais e GitHub Pages
const DB_NAME = 'DisplayManagerDB';
const DB_VERSION = 1;
let dbInstance = null;

function openDB() {
  return new Promise((resolve, reject) => {
    if (dbInstance) return resolve(dbInstance);

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('screens')) {
        db.createObjectStore('screens', { keyPath: 'code' });
      }
      if (!db.objectStoreNames.contains('mediaBlobs')) {
        db.createObjectStore('mediaBlobs', { keyPath: 'id' });
      }
    };

    request.onsuccess = (e) => {
      dbInstance = e.target.result;
      resolve(dbInstance);
    };

    request.onerror = (e) => reject(e.target.error);
  });
}

// Mídias de demonstração SVG padrão em base64/dataURI
const DEFAULT_HORIZONTAL_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080"><defs><linearGradient id="gH" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%230f172a"/><stop offset="50%" stop-color="%231e1b4b"/><stop offset="100%" stop-color="%2331104b"/></linearGradient></defs><rect width="1920" height="1080" fill="url(%23gH)"/><rect x="260" y="220" width="1400" height="640" rx="40" fill="rgba(15,23,42,0.75)" stroke="%236366f1" stroke-width="4"/><text x="960" y="400" font-family="sans-serif" font-size="64" font-weight="900" fill="%23ffffff" text-anchor="middle">DISPLAY MANAGER</text><text x="960" y="500" font-family="sans-serif" font-size="44" font-weight="bold" fill="%23818cf8" text-anchor="middle">MODO HORIZONTAL — 1920 × 1080 (16:9)</text><text x="960" y="580" font-family="sans-serif" font-size="28" fill="%2394a3b8" text-anchor="middle">GitHub Pages &amp; Servidor Local • Reprodução Full Screen</text></svg>`;

const DEFAULT_VERTICAL_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920"><defs><linearGradient id="gV" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="%23090d16"/><stop offset="50%" stop-color="%230f2b38"/><stop offset="100%" stop-color="%23022c22"/></linearGradient></defs><rect width="1080" height="1920" fill="url(%23gV)"/><rect x="120" y="240" width="840" height="1440" rx="48" fill="rgba(15,23,42,0.8)" stroke="%2310b981" stroke-width="4"/><text x="540" y="500" font-family="sans-serif" font-size="52" font-weight="900" fill="%23ffffff" text-anchor="middle">DISPLAY MANAGER</text><text x="540" y="600" font-family="sans-serif" font-size="36" font-weight="bold" fill="%2334d399" text-anchor="middle">MODO VERTICAL — 1080 × 1920 (9:16)</text><text x="540" y="700" font-family="sans-serif" font-size="28" fill="%2394a3b8" text-anchor="middle">Ideal para Totens &amp; Displays em Retrato</text></svg>`;

// Inicializa dados padrão no IndexedDB
async function initDefaultData() {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction('screens', 'readwrite');
    const store = tx.objectStore('screens');
    const checkReq = store.get('SIGN-1080');

    checkReq.onsuccess = () => {
      if (!checkReq.result) {
        const defaultScreen = {
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
              filename: 'demo-horizontal.svg',
              originalName: 'demo-horizontal-1920x1080.svg',
              type: 'image',
              dataUrl: DEFAULT_HORIZONTAL_SVG,
              mimeType: 'image/svg+xml',
              size: 2048,
              duration: 8,
              order: 0,
              active: true,
              createdAt: new Date().toISOString()
            },
            {
              id: 'media_sample_2',
              filename: 'demo-vertical.svg',
              originalName: 'demo-vertical-1080x1920.svg',
              type: 'image',
              dataUrl: DEFAULT_VERTICAL_SVG,
              mimeType: 'image/svg+xml',
              size: 2048,
              duration: 8,
              order: 1,
              active: true,
              createdAt: new Date().toISOString()
            }
          ]
        };
        store.put(defaultScreen);
      }
      resolve();
    };
    checkReq.onerror = () => resolve();
  });
}

// BroadcastChannel para sincronização instantânea entre abas no mesmo navegador
const localBroadcast = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('display_manager_sync') : null;

window.DisplayStorage = {
  isGitHubPages,
  openDB,
  initDefaultData,
  localBroadcast,

  // Verifica se o backend REST responde
  async checkServerAvailable() {
    if (isGitHubPages) return false;
    try {
      const res = await fetch('/api/screens', { method: 'GET', signal: AbortSignal.timeout(1500) });
      return res.ok;
    } catch (e) {
      return false;
    }
  },

  // Busca todas as telas
  async getScreens() {
    const serverOk = await this.checkServerAvailable();
    if (serverOk) {
      const res = await fetch('/api/screens');
      return await res.json();
    }

    await initDefaultData();
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('screens', 'readonly');
      const store = tx.objectStore('screens');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  },

  // Busca uma tela pelo código
  async getScreen(code) {
    const formattedCode = (code || '').toUpperCase().trim();
    const serverOk = await this.checkServerAvailable();
    if (serverOk) {
      const res = await fetch(`/api/screens/${encodeURIComponent(formattedCode)}`);
      if (!res.ok) throw new Error('Tela não encontrada no servidor.');
      return await res.json();
    }

    await initDefaultData();
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('screens', 'readonly');
      const store = tx.objectStore('screens');
      const req = store.get(formattedCode);
      req.onsuccess = () => {
        if (req.result) resolve(req.result);
        else reject(new Error('Código de tela inválido ou não encontrado.'));
      };
      req.onerror = () => reject(req.error);
    });
  },

  // Salva ou atualiza uma tela
  async saveScreen(screen) {
    const serverOk = await this.checkServerAvailable();
    if (serverOk) {
      const res = await fetch(`/api/screens/${encodeURIComponent(screen.code)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(screen)
      });
      return await res.json();
    }

    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('screens', 'readwrite');
      const store = tx.objectStore('screens');
      const req = store.put(screen);
      req.onsuccess = () => {
        if (localBroadcast) {
          localBroadcast.postMessage({ type: 'screen-updated', screen });
        }
        resolve(screen);
      };
      req.onerror = () => reject(req.error);
    });
  },

  // Cria uma nova tela
  async createScreen(screenData) {
    const serverOk = await this.checkServerAvailable();
    if (serverOk) {
      const res = await fetch('/api/screens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(screenData)
      });
      return await res.json();
    }

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let rand = '';
    for (let i = 0; i < 4; i++) rand += chars.charAt(Math.floor(Math.random() * chars.length));
    const code = screenData.code || `DP-${rand}`;

    const newScreen = {
      id: 'screen_' + Date.now(),
      code,
      name: screenData.name || `Tela ${code}`,
      orientation: screenData.orientation || 'horizontal',
      fitMode: screenData.fitMode || 'contain',
      defaultImageDuration: Number(screenData.defaultImageDuration) || 10,
      createdAt: new Date().toISOString(),
      playlist: []
    };

    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('screens', 'readwrite');
      const store = tx.objectStore('screens');
      const req = store.add(newScreen);
      req.onsuccess = () => {
        if (localBroadcast) {
          localBroadcast.postMessage({ type: 'screen-created', screen: newScreen });
        }
        resolve(newScreen);
      };
      req.onerror = () => reject(req.error);
    });
  },

  // Exclui uma tela
  async deleteScreen(code) {
    const formattedCode = (code || '').toUpperCase().trim();
    const serverOk = await this.checkServerAvailable();
    if (serverOk) {
      const res = await fetch(`/api/screens/${encodeURIComponent(formattedCode)}`, { method: 'DELETE' });
      return await res.json();
    }

    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('screens', 'readwrite');
      const store = tx.objectStore('screens');
      const req = store.delete(formattedCode);
      req.onsuccess = () => {
        if (localBroadcast) {
          localBroadcast.postMessage({ type: 'screen-deleted', code: formattedCode });
        }
        resolve({ message: 'Tela excluída.' });
      };
      req.onerror = () => reject(req.error);
    });
  },

  // Salva arquivo de mídia como Blob no IndexedDB
  async saveMediaBlob(mediaId, blob) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('mediaBlobs', 'readwrite');
      const store = tx.objectStore('mediaBlobs');
      const req = store.put({ id: mediaId, blob });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  },

  // Recupera o arquivo de mídia como Blob
  async getMediaBlob(mediaId) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('mediaBlobs', 'readonly');
      const store = tx.objectStore('mediaBlobs');
      const req = store.get(mediaId);
      req.onsuccess = () => resolve(req.result ? req.result.blob : null);
      req.onerror = () => reject(req.error);
    });
  }
};
